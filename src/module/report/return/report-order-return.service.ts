import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class ReportOrderReturnService {
  constructor(private readonly prisma: PrismaService) {}

  private errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
  };

  async getReportOrderReturns(
    storeId: string,
    query: Prisma.OrderReturnFindManyArgs,
  ) {
    await this.checkStore(storeId);

    const baseWhere = query.where ?? {};
    const returnWhere: Prisma.OrderReturnWhereInput = {
      AND: [baseWhere, { store_id: storeId }],
    };

    const orderBy = this.mapOrderBy(
      query.orderBy as Record<string, Prisma.SortOrder> | undefined,
    );

    const [items, total] = await Promise.all([
      this.prisma.orderReturnItem.findMany({
        where: {
          order_return: returnWhere,
        },
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          order_return: {
            select: {
              order_return_number: true,
              order_number: true,
              customer_name: true,
              return_status: true,
              return_type: true,
              total: true,
              createdAt: true,
            },
          },
          variant: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              name: true,
              baseUnit: true,
            },
          },
        },
      }),
      this.prisma.orderReturnItem.count({
        where: {
          order_return: returnWhere,
        },
      }),
    ]);

    const offset = query.skip ?? 0;
    const rows = items.map((item, index) => ({
      stt: offset + index + 1,
      return_date: item.order_return.createdAt,
      return_number: item.order_return.order_return_number,
      order_number: item.order_return.order_number,
      customer_name: item.order_return.customer_name || '',
      return_status: item.order_return.return_status,
      return_type: item.order_return.return_type,
      total_return: Number(item.order_return.total ?? 0),
      variant_name: item.variant?.name || item.item_name || '',
      product_name: item.product?.name || '',
      base_unit: item.product?.baseUnit || '',
      quantity: Number(item.quantity ?? 0),
      line_total: Number(item.total ?? 0),
      reason_status: item.reason_status,
      condition: item.condition || '',
    }));

    return {
      data: rows,
      total,
    };
  }

  private mapOrderBy(
    orderBy?: Record<string, Prisma.SortOrder>,
  ): Prisma.OrderReturnItemOrderByWithRelationInput {
    const defaultSort: Prisma.SortOrder = 'desc';

    if (!orderBy) {
      return { order_return: { createdAt: defaultSort } };
    }

    if (orderBy.createdAt) {
      return { order_return: { createdAt: orderBy.createdAt } };
    }

    if (orderBy.order_return_number) {
      return {
        order_return: { order_return_number: orderBy.order_return_number },
      };
    }

    if (orderBy.order_number) {
      return { order_return: { order_number: orderBy.order_number } };
    }

    return { order_return: { createdAt: defaultSort } };
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
