import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma, product_type, stock_movement_type } from '@prisma/client';
import { BadRequestError } from 'app/common/response';
import type { IUserWithPermissions } from 'app/common/types/permission.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';

import { GenerateVariantSkuUseCase } from '../variant/use-case/genereate-sku-variant.usecase';
import { StockMovementService } from '../stock-movement/stock-movement.service';

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
    private readonly stockMovementService: StockMovementService,
  ) {}

  async create(
    user: IUserWithPermissions,
    storeId: string,
    data: CreateProductDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const genSku = await this.generateSku.generateSku(storeId);
      await this.checkHasSku(data.sku || genSku, storeId);
      const { categoryIds, tagIds, quantity, cost, price, ...body } = data;
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
          price: price || 0,
          cost: cost || 0,
        },
      });
      await tx.variantStock.create({
        data: {
          variant_id: newVariant?.id,
          onHand: quantity || 0,
          store_id: storeId,
        },
      });
      // chỉ ghi lại bản ghi stock movement khi quantity user nhập vào khác 0
      if (quantity !== 0) {
        await this.stockMovementService.create(
          newVariant?.id,
          stock_movement_type.ADJUSTMENT,
          quantity || 0,
          tx,
        );
      }
      // }
      return {
        ...newVariant,
        product: {
          baseUnit: newProduct?.baseUnit,
        },
      };
    });
  }

  async findOne(storeId: string, id: string) {
    await this.checkHasProduct(id, storeId);
    const product = await this.prisma.product.findUnique({
      where: {
        store_id: storeId,
        id,
        is_deleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        image_url: true,
        product_status: true,
        barcode: true,
        created_by: true,
        tags: true,
        baseUnit: true,
        categories: true,
        updatedAt: true,
        createdAt: true,
        meta: true,
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            conversions: {
              select: {
                id: true,
                name: true,
                factor: true,
              },
            },
            variant_stocks: {
              where: {
                store_id: storeId,
              },
              select: {
                onHand: true,
                reserved: true,
                damaged: true,
              },
              take: 1,
            },
          },
        },
      },
    });
    return {
      ...product,
      variant: product?.variant.map((item) => {
        return {
          ...item,
          onHand: item?.variant_stocks?.[0]?.onHand,
          reserved: item?.variant_stocks?.[0]?.reserved,
          damaged: item?.variant_stocks?.[0]?.damaged,
        };
      }),
      variant_stocks: undefined,
    };
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
