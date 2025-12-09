import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { Prisma } from '@prisma/client';
import { ConflictError } from 'app/common/response';
import { UpdateVariantDto } from '../dto/update-variant.dto';

@Injectable()
export class UnitConversionService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly errMsg = {
    PRODUCT_NOT_FOUND: 'Sản phẩm không tồn tại trong kho!',
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
    VARIANT_NOT_FOUND: 'Không tìm thấy biến thể của sản phẩm!',
    UNIT_CONVERSION_NOT_FOUND: 'Không tìm thấy biến thể!',
    UNIT_CONVERSION_EXISTS:
      'Biến thể nây được tìm thấy trong sản phẩm. Vui lòng thử lại!',
  };

  async create(
    variant_id: string,
    dto: CreateUnitConversionDto[],
    tx: Prisma.TransactionClient | PrismaService,
  ) {
    if (!dto.length) return;
    const client = tx ?? this.prisma;
    return client.unitConversion.createMany({
      data: dto.map((item) => ({
        name: item.name,
        factor: item.factor,
        variantId: variant_id,
      })),
    });
  }

  async updateConversions(variantId: string, dto: UpdateVariantDto) {
    const { conversions } = dto;
    return this.prisma.variant.update({
      where: {
        id: variantId,
      },
      data: {
        conversions: {
          deleteMany: {
            id: {
              notIn: conversions
                ?.filter((i) => i.unit_id)
                .map((i) => i.unit_id),
            },
          },
          create: conversions
            ?.filter((i) => !i.unit_id)
            .map((i) => ({
              name: i.name ?? '',
              factor: i.factor ?? 0,
            })),
          update: conversions
            ?.filter((i) => i.unit_id)
            .map((i) => ({
              where: {
                id: i.unit_id,
              },
              data: {
                name: i.name ?? '',
                factor: i.factor ?? 0,
              },
            })),
        },
      },
      include: {
        conversions: true,
      },
    });
  }

  async validateUniqueNames(variantId: string, names: string[]) {
    const existsName = await this.prisma.unitConversion.findFirst({
      where: {
        variantId: variantId,
        name: {
          in: names,
        },
      },
    });
    if (existsName) {
      throw new ConflictError(this.errMsg.UNIT_CONVERSION_EXISTS);
    }
  }
  async removeUnitConversion(variantId: string) {
    return this.prisma.unitConversion.deleteMany({
      where: {
        variantId: variantId,
      },
    });
  }
}
