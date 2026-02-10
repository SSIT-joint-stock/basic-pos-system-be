import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class ReportStockService {
  constructor(private readonly prisma: PrismaService) {}

  private errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
  };

  async getReportStocks(
    storeId: string,
    query: Prisma.VariantStockFindManyArgs,
    search?: string,
  ) {
    await this.checkStore(storeId);

    const baseWhere = query.where ?? {};
    const searchWhere = this.buildSearchWhere(search);

    const where: Prisma.VariantStockWhereInput = {
      AND: [
        baseWhere,
        { store_id: storeId },
        ...(searchWhere ? [searchWhere] : []),
      ],
    };

    const [stocks, total] = await Promise.all([
      this.prisma.variantStock.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.variantStock.count({
        where,
      }),
    ]);

    const offset = query.skip ?? 0;
    const rows = stocks.map((item, index) => {
      const onHand = Number(item.onHand ?? 0);
      const cost = Number(item.variant?.cost ?? 0);
      return {
        stt: offset + index + 1,
        product_name: item.variant?.product?.name || '',
        variant_name: item.variant?.name || '',
        sku: item.variant?.sku || '',
        base_unit: item.variant?.product?.baseUnit || '',
        on_hand: onHand,
        reserved: Number(item.reserved ?? 0),
        damaged: Number(item.damaged ?? 0),
        price: Number(item.variant?.price ?? 0),
        cost: cost,
        stock_value: onHand * cost,
      };
    });

    return {
      data: rows,
      total,
    };
  }

  private buildSearchWhere(search?: string) {
    if (!search || !search.trim()) return undefined;
    return {
      variant: {
        is: {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              sku: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              product: {
                is: {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        },
      },
    } as Prisma.VariantStockWhereInput;
  }

  private async checkStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) throw new NotFoundError(this.errMsg.STORE_NOT_FOUND);
    return store;
  }
}
