import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from 'app/common/response';
import { GenerateBundleSkuUseCase } from 'app/module/bundle/use-case/generate-code.usecase';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

@Injectable()
export class BundleService {
  private readonly errorMessages = {
    BUNDLE_NOT_FOUND: 'Không tìm thấy combo!',
    BUNDLE_SKU_EXISTS:
      'Mã combo đã tồn tại trong cửa hàng. Vui lòng thử lập mã khác!',
    BUNDLE_NAME_EXISTS:
      'Tên combo đã tồn tại trong cửa hàng. Vui lòng chọn tên khác!',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly generateCode: GenerateBundleSkuUseCase,
  ) {}

  async create(createBundleDto: CreateBundleDto, storeId: string) {
    const { items, ...body } = createBundleDto;
    let variantName = '';
    await this.checkHasSku(body.sku, storeId);
    await this.checkHasName(body.name, storeId);

    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const variant = await tx.variant.findFirst({
          where: {
            id: item.variantId,
            product: {
              store_id: storeId,
            },
          },
        });
        if (!variant) {
          throw new NotFoundError(
            `Biến thể với id ${item.variantId} không tồn tại trong cửa hàng!`,
          );
        }
        variantName = variant.name;
      }
      const bundle = await tx.bundle.create({
        data: {
          ...body,
          sku: body.sku || (await this.generateCode.generateSku(storeId)),
          storeId,
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              variant_name: variantName,
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: true,
            },
          },
        },
      });

      return bundle;
    });
  }

  async findAll(storeId: string, query: Prisma.BundleFindManyArgs) {
    const where: Prisma.BundleWhereInput = {
      ...query.where,
      storeId,
    };

    const [data, total] = await Promise.all([
      this.prisma.bundle.findMany({
        ...query,
        where,
        include: {
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.bundle.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string, storeId: string) {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id, storeId },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!bundle) {
      throw new BadRequestError(this.errorMessages.BUNDLE_NOT_FOUND);
    }

    return bundle;
  }

  async update(id: string, updateBundleDto: UpdateBundleDto, storeId: string) {
    await this.findOne(id, storeId);
    let variantName = '';

    if (updateBundleDto.sku) {
      await this.checkHasSku(updateBundleDto.sku, storeId, id);
    }

    if (updateBundleDto.name) {
      await this.checkHasName(updateBundleDto.name, storeId, id);
    }

    const { items, ...body } = updateBundleDto;

    return this.prisma.$transaction(async (tx) => {
      // If items are provided, replace them
      if (items) {
        for (const item of items) {
          const variant = await tx.variant.findFirst({
            where: {
              id: item.variantId,
              product: {
                store_id: storeId,
              },
            },
          });
          if (!variant) {
            throw new NotFoundError(
              `Biến thể với id ${item.variantId} không tồn tại trong cửa hàng!`,
            );
          }
          variantName = variant.name;
        }
        // Delete existing items
        await tx.bundleItem.deleteMany({
          where: { bundleId: id },
        });

        // Create new items
        await tx.bundle.update({
          where: { id },
          data: {
            ...body,
            items: {
              create: items.map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
                variant_name: variantName,
              })),
            },
          },
        });
      } else {
        await tx.bundle.update({
          where: { id },
          data: body,
        });
      }

      return this.findOne(id, storeId);
    });
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);

    return this.prisma.bundle.delete({
      where: { id },
    });
  }

  private async checkHasSku(sku: string, storeId: string, bundleId?: string) {
    const hasSku = await this.prisma.bundle.findFirst({
      where: {
        sku,
        storeId,
        NOT: bundleId ? { id: bundleId } : undefined,
      },
    });

    if (hasSku) {
      throw new BadRequestError(this.errorMessages.BUNDLE_SKU_EXISTS);
    }
  }

  private async checkHasName(name: string, storeId: string, bundleId?: string) {
    const hasName = await this.prisma.bundle.findFirst({
      where: {
        name,
        storeId,
        NOT: bundleId ? { id: bundleId } : undefined,
      },
    });

    if (hasName) {
      throw new BadRequestError(this.errorMessages.BUNDLE_NAME_EXISTS);
    }
  }
}
