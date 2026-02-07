import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class ReportSalesService {
  constructor(private readonly prisma: PrismaService) {}

  private errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
  };

  async getReportSales(storeId: string, query: Prisma.OrderFindManyArgs) {
    await this.checkStore(storeId);

    const baseWhere = query.where ?? {};
    const whereWithCustomerSearch = this.attachCustomerSearch(baseWhere);

    const orderWhere: Prisma.OrderWhereInput = {
      AND: [whereWithCustomerSearch, { store_id: storeId }],
    };

    const orderBy = query.orderBy ?? { createdAt: 'desc' };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: orderWhere,
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.order.count({
        where: orderWhere,
      }),
    ]);

    const offset = query.skip ?? 0;
    const rows = orders.map((order, index) => ({
      stt: offset + index + 1,
      order_date: order.createdAt,
      order_code: order.code || '',
      customer_name: order.customer_name || order.customer?.name || 'Khách lẻ',
      total_amount: Number(order.subtotal_amount ?? 0),
      discount_amount: Number(order.discount_amount ?? 0),
      tax_amount: Number(order.tax_amount ?? 0),
      final_amount: Number(order.total_amount ?? 0),
      payment_method: order.payment_method,
      status: order.status,
    }));

    return {
      data: rows,
      total,
    };
  }

  private attachCustomerSearch(where: Prisma.OrderWhereInput) {
    const or = Array.isArray(where.OR) ? [...where.OR] : [];
    if (!or.length) return where;

    const searchValue = this.extractSearchValue(or);
    if (!searchValue) return where;

    or.push({
      customer: {
        is: {
          name: {
            contains: searchValue,
            mode: 'insensitive',
          },
        },
      },
    });

    return {
      ...where,
      OR: or,
    };
  }

  private extractSearchValue(or: Prisma.OrderWhereInput[]) {
    for (const condition of or) {
      if (
        'code' in condition &&
        condition.code &&
        typeof condition.code === 'object' &&
        'contains' in condition.code
      ) {
        const code = condition.code.contains;
        if (typeof code === 'string' && code.trim().length) return code;
      }

      if (
        'customer_name' in condition &&
        condition.customer_name &&
        typeof condition.customer_name === 'object' &&
        'contains' in condition.customer_name
      ) {
        const customerName = condition.customer_name.contains;
        if (typeof customerName === 'string' && customerName.trim().length) {
          return customerName;
        }
      }
    }

    return undefined;
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
