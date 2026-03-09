import { Injectable } from '@nestjs/common';
import { Prisma, product_status, stock_movement_type } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'app/common/response';
import { IUser } from 'app/common/types/user.type';
import { ApplyStockUseCase } from 'app/module/variant/use-case/apply-stock.usecase';
import { PrismaService } from 'app/prisma/prisma.service';
import { StockMovementService } from '../stock-movement/stock-movement.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { UnitConversionService } from './unit-conversion/unit-conversion.service';
import { GenerateVariantSkuUseCase } from './use-case/genereate-sku-variant.usecase';

@Injectable()
export class VariantService {
  private readonly errMsg = {
    PRODUCT_NOT_FOUND: 'Sản phẩm không tồn tại trong kho!',
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
    VARIANT_NOT_FOUND: 'Không tìm thấy biến thể của sản phẩm!',
    CANNOT_DELETE_VARIANT:
      'Không thể xoá biến thể cuối cùng của sản phẩm. Vui lòng xoá sản phẩm!',
    VARIANT_EXISTED_BARCODE_OR_SKU:
      'Mã vach (barcode) / mã (sku) biến thể này được tìm thấy trong cửa hàng. Vui lòng thử lại!',
    VARIANT_NAME_EXISTED:
      'Tên biến thể này được tìm thấy trong sản phẩm. Vui lòng thử lại!',
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateSkuVariant: GenerateVariantSkuUseCase,
    private readonly stockMovement: StockMovementService,
    private readonly unitConversion: UnitConversionService,
    private readonly applyStock: ApplyStockUseCase,
  ) {}
  async create(dto: CreateVariantDto, productId: string, storeId: string) {
    const generateSku =
      await this.generateSkuVariant.generateSkuVariant(storeId);
    const { stock, conversions, ...res } = dto;
    await Promise.all([
      this.checkStore(storeId),
      this.checkProduct(productId),
      this.existedVariant(storeId, undefined, dto.sku, dto.barcode),
      this.existedVariantName(productId, undefined, dto.name),
    ]);
    return this.prisma.$transaction(async (tx) => {
      const newVariant = await tx.variant.create({
        data: {
          ...res,
          sku: dto.sku || generateSku,
          product_id: productId,
        },
      });
      await this.unitConversion.create(newVariant?.id, conversions || [], tx);
      await tx.variantStock.create({
        data: {
          variant_id: newVariant.id,
          onHand: stock || 0,
          store_id: storeId,
        },
      });

      if (stock !== 0)
        await this.stockMovement.create(
          newVariant.id,
          stock_movement_type.ADJUSTMENT,
          stock || 0,
          tx,
        );
    });
  }

  async findALlInProduct(productId: string, storeId: string) {
    await this.checkProduct(productId, storeId);
    return this.prisma.variant.findMany({
      where: {
        product_id: productId,
        product: { store_id: storeId, is_deleted: false },
      },
    });
  }
  async findOneInProduct(id: string, productId: string, storeId: string) {
    await this.checkProduct(productId, storeId);
    return await this.checkVariant(id, productId, storeId);
  }
  async findAll(storeId: string, query: Prisma.VariantFindManyArgs) {
    await this.checkStore(storeId);
    const where: Prisma.VariantWhereInput = {
      AND: [
        query.where ?? {},
        {
          product: {
            store_id: storeId,
            product_status: product_status.ACTIVE,
            is_deleted: false,
          },
        },
      ],
    };

    const [variants, total] = await Promise.all([
      this.prisma.variant.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          conversions: true,
          product: true,
          variant_stocks: {
            select: {
              onHand: true,
              reserved: true,
              damaged: true,
            },
            where: {
              store_id: storeId,
            },
            take: 1,
          },
        },
      }),
      this.prisma.variant.count({
        where,
      }),
    ]);
    const normalizedVariants = variants.map((variant) => {
      const stock = variant.variant_stocks?.[0];

      return {
        ...variant,
        onHand: stock?.onHand ?? 0,
        reserved: stock?.reserved ?? 0,
        damaged: stock?.damaged ?? 0,
        variant_stocks: undefined,
      };
    });

    return { data: normalizedVariants, total };
  }

  async update(
    id: string,
    productId: string,
    dto: UpdateVariantDto,
    storeId: string,
  ) {
    await Promise.all([
      this.checkVariant(id, productId, storeId),
      this.existedVariant(storeId, id, dto.sku, dto.barcode),
      this.existedVariantName(productId, id, dto.name),
    ]);
    if (dto.sku?.trim() === '') {
      dto.sku = await this.generateSkuVariant.generateSkuVariant(storeId);
    }
    const { conversions, ...variantInfo } = dto;

    const updated = await this.prisma.variant.update({
      where: { id, product_id: productId },
      data: variantInfo,
    });
    if (conversions) {
      await this.unitConversion.updateConversions(id, dto);
    }
    return updated;
  }

  async remove(id: string, productId: string, storeId: string) {
    const product = await this.checkProduct(productId, storeId);
    if (product.variant.length === 1) {
      throw new BadRequestError(this.errMsg.CANNOT_DELETE_VARIANT);
    }
    await this.checkVariant(id, productId, storeId);
    const deleted = await this.prisma.variant.delete({
      where: {
        id,
        product_id: productId,
      },
    });
    await this.unitConversion.removeUnitConversion(id);
    return deleted;
  }

  async applyStockForVariant(
    type: stock_movement_type,
    user: IUser,
    id: string,
    productId: string,
    delta: number,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      return await this.applyStock.execute(
        type,
        user?.storeId || '',
        id,
        productId,
        delta,
        tx,
      );
    });
  }
  // Private helpers method

  private async checkProduct(id: string, storeId?: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
        store_id: storeId,
        is_deleted: false,
      },
      include: {
        variant: true,
      },
    });
    if (!product) {
      throw new NotFoundError(this.errMsg.PRODUCT_NOT_FOUND);
    }
    return product;
  }
  private async checkVariant(id: string, productId: string, storeId?: string) {
    const variant = await this.prisma.variant.findUnique({
      where: {
        id,
        product_id: productId,
        product: {
          store_id: storeId,
        },
      },
      include: {
        conversions: true,
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
    });
    if (!variant) {
      throw new NotFoundError(this.errMsg.VARIANT_NOT_FOUND);
    }
    return {
      ...variant,
      onHand: variant?.variant_stocks?.[0]?.onHand,
      reserved: variant?.variant_stocks?.[0]?.reserved,
      damaged: variant?.variant_stocks?.[0]?.damaged,
    };
  }
  private async existedVariant(
    storeId: string,
    id?: string,
    sku?: string,
    barcode?: string,
  ) {
    const filters: Prisma.VariantWhereInput[] = [];

    if (sku && sku.trim() !== '') {
      filters.push({ sku });
    }

    if (barcode && barcode.trim() !== '') {
      filters.push({ barcode });
    }

    if (filters.length === 0) return null;

    const variant = await this.prisma.variant.findFirst({
      where: {
        product: {
          store_id: storeId,
        },
        OR: filters,
        NOT: {
          id: id, // Loại trừ variant hiện tại (nếu update)
        },
      },
    });

    if (variant) {
      throw new ConflictError(this.errMsg.VARIANT_EXISTED_BARCODE_OR_SKU);
    }
    return variant;
  }
  private async existedVariantName(
    productId: string,
    id?: string,
    name?: string,
  ) {
    const variant = await this.prisma.variant.findFirst({
      where: {
        product_id: productId,
        name: name,
        NOT: {
          id: id, // Loại trừ variant hiện tại (nếu update)
        },
      },
    });

    if (variant) {
      throw new ConflictError(this.errMsg.VARIANT_NAME_EXISTED);
    }
    return variant;
  }

  private async checkStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) {
      throw new NotFoundError(this.errMsg.STORE_NOT_FOUND);
    }
  }
}
