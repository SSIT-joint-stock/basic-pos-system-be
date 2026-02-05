import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

type OrderItemWithRelations = Prisma.OrderItemGetPayload<{
  include: {
    order: {
      select: {
        createdAt: true;
        code: true;
        customer_name: true;
        total_amount: true;
        customer: {
          select: {
            name: true;
          };
        };
      };
    };
    variant: {
      select: {
        name: true;
        cost: true;
      };
    };
    product: {
      select: {
        name: true;
        baseUnit: true;
      };
    };
  };
}>;

@Injectable()
export class ReportOrderItemService {
  constructor(private readonly prisma: PrismaService) {}

  private errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
  };

  async getReportOrderItems(storeId: string, query: Prisma.OrderFindManyArgs) {
    await this.checkStore(storeId);

    const baseWhere = query.where ?? {};
    const whereWithCustomerSearch = this.attachCustomerSearch(baseWhere);

    const orderWhere: Prisma.OrderWhereInput = {
      AND: [whereWithCustomerSearch, { store_id: storeId }],
    };

    const orderBy = this.mapOrderBy(
      query.orderBy as Record<string, Prisma.SortOrder> | undefined,
    );

    const [orderItems, total] = (await Promise.all([
      this.prisma.orderItem.findMany({
        where: {
          order: orderWhere,
        },
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          order: {
            select: {
              createdAt: true,
              code: true,
              customer_name: true,
              total_amount: true,
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
          variant: {
            select: {
              name: true,
              cost: true,
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
      this.prisma.orderItem.count({
        where: {
          order: orderWhere,
        },
      }),
    ])) as [OrderItemWithRelations[], number];

    const offset = query.skip ?? 0;
    const rows = orderItems.map((item, index) => ({
      stt: offset + index + 1,
      order_created_at: item.order.createdAt,
      order_code: item.order.code || '',
      customer_name:
        item.order.customer_name || item.order.customer?.name || '',
      order_total_amount: Number(item.order.total_amount ?? 0),
      variant_name: item.variant?.name || '',
      product_name: item.product?.name || '',
      base_unit: item.product?.baseUnit || '',
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0),
      line_total: Number(item.total ?? 0),
      cost:
        item.variant?.cost !== null && item.variant?.cost !== undefined
          ? Number(item.variant.cost)
          : undefined,
    }));

    return {
      data: rows,
      total,
    };
  }

  private mapOrderBy(
    orderBy?: Record<string, Prisma.SortOrder>,
  ): Prisma.OrderItemOrderByWithRelationInput {
    const defaultSort: Prisma.SortOrder = 'desc';
    if (!orderBy) {
      return { order: { createdAt: defaultSort } };
    }

    if (orderBy.createdAt) {
      return { order: { createdAt: orderBy.createdAt } };
    }

    if (orderBy.code) {
      return { order: { code: orderBy.code } };
    }

    return { order: { createdAt: defaultSort } };
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
      const code = (condition as { code?: { contains?: string } }).code
        ?.contains;
      if (typeof code === 'string' && code.trim().length) return code;

      const customerName = (
        condition as { customer_name?: { contains?: string } }
      ).customer_name?.contains;
      if (typeof customerName === 'string' && customerName.trim().length) {
        return customerName;
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
