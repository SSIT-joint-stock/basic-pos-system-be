import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import {
  Prisma,
  product_type,
  ProductTemplate,
  stock_movement_type,
} from '@prisma/client';
import { BadRequestError } from 'app/common/response';
import type { IUserWithPermissions } from 'app/common/types/permission.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as XLSX from 'xlsx';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';

import { CreateProductTemplateDto } from './dto/create-product-template-dto';
import { GenerateVariantSkuUseCase } from '../variant/use-case/genereate-sku-variant.usecase';

@Injectable()
export class ProductService {
  private readonly errorMessages = {
    // Product Management
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm!',
    PRODUCT_SKU_EXISTS:
      'Mã sản phẩm đã tồn tại trong cửa hàng. Vui lòng thử lập mã khác!',

    // File
    FILE_NOT_FOUND: 'File not found',
    FILE_EMPTY: 'File is empty',
    FILE_TOO_LARGE: 'File size is too large, maximum allowed is 500 rows',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly generateSku: GenerateProductSkuUseCase,
    private readonly generateVariantSku: GenerateVariantSkuUseCase,
  ) {}

  async create(
    user: IUserWithPermissions,
    storeId: string,
    data: CreateProductDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const genSku = await this.generateSku.generateSku(storeId);
      await this.checkHasSku(data.sku || genSku, storeId);
      const { categoryIds, tagIds, quantity, ...body } = data;
      // create product
      const newProduct = await tx.product.create({
        data: {
          ...body,
          sku: data.sku || genSku,
          store_id: storeId,
          created_by: user.id,
          source_type: product_type.QUICK_CREATE,

          categories: categoryIds?.length
            ? { connect: categoryIds.map((id) => ({ id })) }
            : undefined,

          tags: tagIds?.length
            ? { connect: tagIds.map((id) => ({ id })) }
            : undefined,
        },

        include: {
          categories: true,
          tags: true,
          variant: true,
        },
      });
      // create variant now pos sys always set default is is_set_default_variant and when find some plan to implement this feat
      // if (data.is_set_default_variant === true) {
      const newVariant = await tx.variant.create({
        data: {
          product_id: newProduct?.id,
          name: newProduct?.name,
          sku:
            (await this.generateVariantSku.generateSkuVariant(storeId)) || '',
          price: newProduct?.price,
        },
      });
      await tx.variantStock.create({
        data: {
          variant_id: newVariant?.id,
          onHand: quantity || 0,
          store_id: storeId,
        },
      });
      await tx.stockMovement.create({
        data: {
          variant_id: newVariant?.id,
          quantity: quantity || 0,
          type: stock_movement_type.ADJUSTMENT,
        },
      });
      // }
    });
  }

  async findOne(storeId: string, id: string) {
    await this.checkHasProduct(id, storeId);
    return await this.prisma.product.findUnique({
      where: { store_id: storeId, id, is_deleted: false },
      include: {
        categories: true,
        tags: true,
        variant: true,
      },
    });
  }

  async update(storeId: string, id: string, data: UpdateProductDto) {
    // 1) Lấy product hiện tại để kiểm tra tồn tại

    await this.checkHasProduct(id, storeId);

    if (data.sku) {
      await this.checkHasSku(data.sku, storeId, id);
    }

    const { categoryIds, tagIds, ...res } = data;
    // 3) Thực hiện update
    const updated = await this.prisma.product.update({
      where: { id, store_id: storeId },
      data: {
        ...res,

        categories:
          categoryIds !== undefined
            ? {
                set: categoryIds.map((id) => ({ id })),
              }
            : undefined,
        tags:
          tagIds !== undefined
            ? {
                set: tagIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: { categories: true, tags: true }, // FIX: Sau co the bo
    });
    return updated;
  }

  async remove(storeId: string, id: string) {
    await this.checkHasProduct(id, storeId);
    // return await this.prisma.product.update({
    //   where: { id, store_id: storeId },
    //   data: {
    //     deletedAt: new Date(),
    //     is_deleted: true,
    //   },
    // });
    return await this.prisma.product.delete({
      where: { id, store_id: storeId },
    });
  }

  async filterProducts(store_id: string, query: Prisma.ProductFindManyArgs) {
    // TODO: chua co meta
    const where: Prisma.ProductWhereInput = {
      AND: [query.where ?? {}, { store_id, is_deleted: false }],
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,

        include: {
          categories: true,
          tags: true,
          variant: true,
          purchase_order_items: true,
        },
      }),
      this.prisma.product.count({
        where,
      }),
    ]);

    return { data: products, total };
  }

  async getProductSuggestion(query: Prisma.ProductFindManyArgs) {
    const where: Prisma.ProductWhereInput = {
      AND: [query.where ?? {}],
    };

    const [products, total_product] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          categories: true,
          tags: true,
        },
      }),
      this.prisma.product.count({
        where,
      }),
    ]);
    const templateWhere: Prisma.ProductTemplateWhereInput = query.where
      ? ({
          AND: [query.where as unknown as Prisma.ProductTemplateWhereInput],
        } as Prisma.ProductTemplateWhereInput)
      : {};
    const templateOrderBy = query.orderBy as unknown as
      | Prisma.ProductTemplateOrderByWithRelationInput
      | Prisma.ProductTemplateOrderByWithRelationInput[]
      | undefined;

    // take_template = limit - take_product
    const takeRequested =
      typeof query.take === 'number' && query.take > 0 ? query.take : 10; // ✅ nếu null/undefined hoặc <=0 thì mặc định = 10
    const takeRequestProductTemplate =
      takeRequested - total_product > 0 ? takeRequested - total_product : 0;
    const [templates, total_template] = await Promise.all([
      this.prisma.productTemplate.findMany({
        where: templateWhere,
        take: takeRequestProductTemplate,
        orderBy: templateOrderBy,
      }),
      this.prisma.productTemplate.count({ where: templateWhere }),
    ]);
    const combined = [
      ...products.map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        price: p.price,
        cost: p.cost,
        image_url: p.image_url,
        source: 'PRODUCT',
        categories: p.categories,
        tags: p.tags,
      })),
      ...templates.map((t) => ({
        id: t.id,
        name: t.name,
        barcode: t.barcode,
        price: t.price ?? null,
        cost: t.cost ?? null,
        image_url: t.image_url ?? null,
        source: 'TEMPLATE',
      })),
    ];

    return { data: combined, total: total_product + total_template };
  }

  async createProductsTemplate(items: CreateProductTemplateDto[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Items must not be empty');
    }

    const payloadBarcodes = items.map((i) => i.barcode?.trim());
    if (payloadBarcodes.length !== items.length) {
      throw new BadRequestError('Every item must have a non-empty barcode');
    }

    //Kiểm tra TRÙNG BARCODE trong batch product
    const duplicates = Object.entries(
      payloadBarcodes.reduce<Record<string, number>>((acc, barcode) => {
        const b = barcode;
        acc[b] = (acc[b] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .filter(([, count]) => count > 1)
      .map(([sku]) => sku);

    if (duplicates.length > 0) {
      throw new BadRequestError(
        `Duplicate SKUs found in batch: ${duplicates.join(', ')}`,
      );
    }

    // Lấy danh sách BARCODE đã có trong DB
    const existingProductsTemplate = await this.prisma.productTemplate.findMany(
      {
        where: { barcode: { in: payloadBarcodes } },
      },
    );

    const existingBarcodeSet = new Set(
      existingProductsTemplate.map((p) => p.barcode),
    );
    // Chia nhóm
    const newProducts = items.filter((i) => !existingBarcodeSet.has(i.barcode));
    const updateProducts = items.filter((i) =>
      existingBarcodeSet.has(i.barcode),
    );

    const results = await this.prisma.$transaction(async (tx) => {
      const updated: ProductTemplate[] = [];
      const created: ProductTemplate[] = [];

      // 1. Update sản phẩm có sẵn
      for (const p of updateProducts) {
        const existing = existingProductsTemplate.find(
          (e) => e.barcode === p.barcode,
        );

        if (!existing) continue;

        const refreshed = await tx.productTemplate.update({
          where: { id: existing.id },
          data: {
            name: p.name,
            price: p.price,
            cost: p.cost,
            description: p.description,
            image_url: p.image_url,
            meta: p.meta ?? {},
          },
        });
        if (refreshed) updated.push(refreshed as any);
      }

      // 2. Tạo sản phẩm mới
      for (const p of newProducts) {
        const product = await tx.productTemplate.create({
          data: {
            barcode: p.barcode,
            name: p.name,
            price: p.price,
            cost: p.cost,
            image_url: p.image_url,
            description: p.description,
            meta: p.meta,
          },
        });

        console.log(p);

        created.push(product as any);
      }

      return { updated, created };
    });

    return {
      updatedCount: results.updated.length,
      createdCount: results.created.length,
      updated: results.updated,
      created: results.created,
    };
  }
  downloadExampleExcel(): StreamableFile {
    const headers = [
      'name*',
      'sku*',
      'barcode',
      'price*',
      'cost',
      'description',
      'image_url',
      'product_status',
      'category*',
    ];
    const sample = [
      {
        'name*': 'Sample Product',
        'sku*': 'SKU001',
        barcode: '123456789',
        'price*': 10000,
        cost: 8000,
        description: 'This is a sample product',
        image_url: 'http://example.com/image.jpg',
        product_status: 'ACTIVE',
        'category*': 'Sample Category',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sample, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new StreamableFile(buffer, {
      disposition: 'attachment; filename="example_products.xlsx"',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  private async checkHasProduct(productId: string, storeId: string) {
    const hasProduct = await this.prisma.product.findFirst({
      where: {
        id: productId,
        store_id: storeId,
        is_deleted: false,
      },
    });

    if (!hasProduct) {
      throw new BadRequestError(this.errorMessages.PRODUCT_NOT_FOUND);
    }

    return hasProduct;
  }
  private async checkHasSku(sku: string, storeId: string, productId?: string) {
    const hasSku = await this.prisma.product.findFirst({
      where: {
        sku,
        store_id: storeId,
        is_deleted: false,
        NOT: { id: productId },
      },
    });

    if (hasSku) {
      throw new BadRequestError(this.errorMessages.PRODUCT_SKU_EXISTS);
    }
  }
}
