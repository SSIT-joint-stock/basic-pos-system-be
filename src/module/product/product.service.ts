import { Injectable } from '@nestjs/common';
import { Prisma, product_type, stock_movement_type } from '@prisma/client';
import { BadRequestError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';

import { IUser } from 'app/common/types/user.type';
import { AssetsService } from '../assets/assets.service';
import { StockMovementService } from '../stock-movement/stock-movement.service';
import { GenerateVariantSkuUseCase } from '../variant/use-case/genereate-sku-variant.usecase';

@Injectable()
export class ProductService {
  private readonly errorMessages = {
    // Product Management
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm!',
    PRODUCT_SKU_EXISTS:
      'Mã sản phẩm đã tồn tại trong cửa hàng. Vui lòng thử lập mã khác!',
    BARCODE_ALREADY_EXISTS:
      'Mã vạch (barcode) của thuộc tính đã tồn tại ở sản phẩm khác',
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
    private readonly assetsService: AssetsService,
  ) {}

  async create(
    user: IUser,
    storeId: string,
    data: CreateProductDto,
    file?: Express.Multer.File,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const genSku = await this.generateSku.generateSku(storeId);
      const skuToUse = data.sku && data.sku.trim() !== '' ? data.sku : genSku;
      await this.checkHasSku(skuToUse, storeId);
      const { categoryIds, tagIds, quantity, cost, price, barcode, ...body } =
        data;
      // create product
      const newProduct = await tx.product.create({
        data: {
          ...body,
          sku: skuToUse,
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

      // Handle file upload if present
      let imageUrl = newProduct.image_url;
      if (file) {
        const asset = await this.assetsService.uploadFile(user, file, {
          entityId: newProduct.id,
          entityType: 'product',
          folder: 'products',
        });
        imageUrl = asset.url;
        // Update product with image_url
        await tx.product.update({
          where: { id: newProduct.id },
          data: { image_url: imageUrl },
        });
      }

      if (barcode && barcode.trim() !== '') {
        await this.checkHasBarCode(barcode, storeId);
      }
      const newVariant = await tx.variant.create({
        data: {
          product_id: newProduct?.id,
          name: newProduct?.name,
          sku: await this.generateVariantSku.generateSkuVariant(storeId),
          price: price || 0,
          cost: cost || 0,
          barcode: barcode || '',
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
          image_url: imageUrl,
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

  async update(
    storeId: string,
    id: string,
    data: UpdateProductDto,
    user: IUser,
    file?: Express.Multer.File,
  ) {
    // 1) Lấy product hiện tại để kiểm tra tồn tại

    await this.checkHasProduct(id, storeId);

    if (data.sku) {
      await this.checkHasSku(data.sku, storeId, id);
    }

    const { categoryIds, tagIds, barcode, ...res } = data;

    // Handle file upload if present
    let imageUrl = res.image_url;
    if (file) {
      const asset = await this.assetsService.uploadFile(user, file, {
        entityId: id,
        entityType: 'product',
        folder: 'products',
      });
      imageUrl = asset.url;
    }

    // 3) Thực hiện update
    const updated = await this.prisma.product.update({
      where: { id, store_id: storeId },
      data: {
        ...res,
        image_url: imageUrl,

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

    if (barcode && barcode.trim() !== '') {
      await this.checkHasBarCode(barcode, storeId, id);
      // Khi update thông qua Product level, ta mặc định update barcode cho variant đầu tiên tìm thấy
      // (Phù hợp với mô hình Quick Create 1 sản phẩm - 1 variant)
      const firstVariant = await this.prisma.variant.findFirst({
        where: { product_id: id },
      });
      if (firstVariant) {
        await this.prisma.variant.update({
          where: { id: firstVariant.id },
          data: { barcode },
        });
      }
    }

    return updated;
  }

  async remove(storeId: string, id: string) {
    await this.checkHasProduct(id, storeId);

    // Soft delete - chỉ đánh dấu là đã xóa
    return await this.prisma.product.update({
      where: { id, store_id: storeId },
      data: {
        is_deleted: true,
        deletedAt: new Date(),
      },
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
        // is_deleted: false, // Bỏ is_deleted: false vì Prisma unique constraint áp dụng cho cả record đã xóa (is_deleted: true)
        NOT: { id: productId },
      },
    });

    if (hasSku) {
      throw new BadRequestError(this.errorMessages.PRODUCT_SKU_EXISTS);
    }
  }
  private async checkHasBarCode(
    barcode: string,
    storeId: string,
    productId?: string,
  ) {
    const hasBarcode = await this.prisma.variant.findFirst({
      where: {
        barcode,
        product: {
          store_id: storeId,
          is_deleted: false,
        },
        // Nếu là cập nhật sản phẩm, ta cho phép giữ lại barcode của chính sản phẩm đó (nhưng không được trùng của sản phẩm khác)
        // Nếu là tạo mới thì productId là undefined, filter này sẽ tìm toàn bộ store
        ...(productId ? { NOT: { product_id: productId } } : {}),
      },
    });

    if (hasBarcode) {
      throw new BadRequestError(this.errorMessages.BARCODE_ALREADY_EXISTS);
    }
  }
}
