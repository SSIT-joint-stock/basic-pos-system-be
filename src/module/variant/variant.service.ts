import { Injectable } from '@nestjs/common';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { PrismaService } from 'app/prisma/prisma.service';
import { ConflictError, NotFoundError } from 'app/common/response';
import { GenerateVariantSkuUseCase } from './use-case/genereate-sku-variant.usecase';

@Injectable()
export class VariantService {
  private readonly errMsg = {
    PRODUCT_NOT_FOUND: 'Sản phẩm không tồn tại trong kho!',
    VARIANT_NOT_FOUND: 'Không tìm thấy biến thể của sản phẩm!',
    ALREADY_HAS_SKU: 'Mã biến thể đã tồn tai. Vui lòng thử lại!',
    ALREADY_VARIANT_IN_PRODUCT:
      'Biến thể nây đã tìm thấy trong sản phẩm. Vui lòng thử lại!',
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateSkuVariant: GenerateVariantSkuUseCase,
  ) {}
  async create(dto: CreateVariantDto, productId: string) {
    await this.checkProduct(productId);
    await this.checkUniqueUnitName(
      productId,
      dto.conversions?.map((i) => i.name) ?? [],
    );
    return this.prisma.variant.create({
      data: {
        ...dto,
        sku:
          dto.sku ||
          (await this.generateSkuVariant.generateSkuVariant(productId)),
        product_id: productId,
        conversions: dto.conversions?.length
          ? {
              create: dto.conversions?.map((c) => ({
                name: c.name || '',
                factor: c.factor || 1,
              })),
            }
          : undefined,
      },
      include: {
        conversions: true,
      },
    });
  }

  async findALlInProduct(id: string, productId: string) {
    await this.checkProduct(productId, id);
    await this.checkVariant(id, productId);
  }

  async update(id: string, productId: string, dto: UpdateVariantDto) {
    await this.checkProduct(productId, id);
    await this.checkVariant(id, productId);
    await this.checkHasVariantSku(id, productId, dto?.sku);
    await this.checkUniqueUnitName(
      productId,
      dto.conversions?.map((i) => i.name || '') ?? [],
    );
    return this.prisma.variant.update({
      where: {
        id,
        product_id: productId,
      },
      data: {
        ...dto,
        conversions: {
          // delete unit conversion when user choose
          deleteMany: {
            id: {
              notIn: dto.conversions
                ?.filter((i) => i.unit_id)
                .map((i) => i.unit_id),
            },
          },
          // create new unit conversion
          create: dto.conversions
            ?.filter((i) => !i.unit_id)
            .map((c) => ({
              name: c.name || '',
              factor: c.factor || 1,
            })),
          // update unit conversion
          update: dto.conversions
            ?.filter((i) => i.unit_id)
            .map((i) => ({
              where: {
                id: i.unit_id,
              },
              data: {
                name: i.name || '',
                factor: i.factor || 1,
              },
            })),
        },
      },
      include: {
        conversions: true,
      },
    });
  }

  async remove(id: string, productId: string) {
    await this.checkProduct(productId, id);
    await this.checkVariant(id, productId);
    return this.prisma.variant.delete({
      where: {
        id,
        product_id: productId,
        conversions: {
          none: {},
        },
      },
    });
  }

  private async checkProduct(id: string, storeId?: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
        store_id: storeId,
      },
    });
    if (!product) {
      throw new NotFoundError(this.errMsg.PRODUCT_NOT_FOUND);
    }
    return product;
  }
  private async checkVariant(id: string, productId: string) {
    const variant = await this.prisma.variant.findUnique({
      where: {
        id,
        product_id: productId,
      },
      include: {
        conversions: true,
      },
    });
    if (!variant) {
      throw new NotFoundError(this.errMsg.VARIANT_NOT_FOUND);
    }
    return variant;
  }
  private async checkHasVariantSku(
    id: string,
    productId: string,
    sku?: string,
  ) {
    const hasSkuVariant = await this.prisma.variant.findFirst({
      where: {
        id,
        product_id: productId,
        sku,
        NOT: {
          id,
          product_id: productId,
        },
      },
    });
    if (hasSkuVariant) {
      throw new ConflictError(this.errMsg.ALREADY_HAS_SKU);
    }
  }
  private async checkUniqueUnitName(productId: string, name: string[]) {
    const hasUnitName = await this.prisma.variant.findFirst({
      where: {
        product_id: productId,
        conversions: {
          some: {
            name: {
              in: name,
            },
          },
        },
      },
    });
    if (hasUnitName) {
      throw new ConflictError(this.errMsg.ALREADY_VARIANT_IN_PRODUCT);
    }
  }
}
