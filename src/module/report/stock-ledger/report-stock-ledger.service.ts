import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FilterParseResult } from 'app/common/decorators/filter-parse.decorator';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

interface StockLedgerRow {
  created_at: Date;
  code: string;
  type: 'NHẬP' | 'XUẤT';
  partner_name: string;
  variant_name: string;
  product_name: string;
  base_unit: string;
  quantity_in: number;
  quantity_out: number;
  unit_price: number;
  line_total: number;
}

@Injectable()
export class ReportStockLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  private errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
  };

  async getReportStockLedger(
    storeId: string,
    query: FilterParseResult<any>,
    search?: string,
  ) {
    await this.checkStore(storeId);

    const createdAt = (
      query.filters as { createdAt?: { gte?: Date; lte?: Date } }
    ).createdAt;

    const dateFilter =
      createdAt?.gte || createdAt?.lte
        ? {
            gte: createdAt?.gte,
            lte: createdAt?.lte,
          }
        : undefined;

    const purchaseOrderWhere: Prisma.PurchaseOrderWhereInput = {
      store_id: storeId,
      ...(dateFilter ? { order_date: dateFilter } : {}),
    };

    const orderWhere: Prisma.OrderWhereInput = {
      store_id: storeId,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    };

    const [purchaseItems, orderItems] = await Promise.all([
      this.prisma.purchaseOrderItem.findMany({
        where: {
          purchase_order: purchaseOrderWhere,
        },
        include: {
          purchase_order: {
            select: {
              order_number: true,
              order_date: true,
              supplier_name: true,
            },
          },
          product: {
            select: {
              name: true,
              baseUnit: true,
            },
          },
          variant: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: orderWhere,
        },
        include: {
          order: {
            select: {
              code: true,
              createdAt: true,
              customer_name: true,
            },
          },
          product: {
            select: {
              name: true,
              baseUnit: true,
            },
          },
          variant: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const purchaseRows: StockLedgerRow[] = purchaseItems.map((item) => {
      const quantity = Number(item.total_base_qty ?? item.quantity ?? 0);
      return {
        created_at: item.purchase_order.order_date,
        code: item.purchase_order.order_number,
        type: 'NHẬP',
        partner_name: item.purchase_order.supplier_name || '',
        variant_name: item.variant?.name || item.item_name || '',
        product_name: item.product?.name || '',
        base_unit: item.product?.baseUnit || '',
        quantity_in: quantity,
        quantity_out: 0,
        unit_price: Number(item.unit_cost ?? 0),
        line_total: Number(item.total ?? 0),
      };
    });

    const orderRows: StockLedgerRow[] = orderItems.map((item) => ({
      created_at: item.order.createdAt,
      code: item.order.code || '',
      type: 'XUẤT',
      partner_name: item.order.customer_name || '',
      variant_name: item.variant?.name || '',
      product_name: item.product?.name || '',
      base_unit: item.product?.baseUnit || '',
      quantity_in: 0,
      quantity_out: Number(item.quantity ?? 0),
      unit_price: Number(item.price ?? 0),
      line_total: Number(item.total ?? 0),
    }));

    let rows = [...purchaseRows, ...orderRows];

    if (search && search.trim()) {
      const keyword = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        [
          row.code,
          row.partner_name,
          row.variant_name,
          row.product_name,
          row.type,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword)),
      );
    }

    const orderBy = query.prismaQuery.orderBy as
      | Record<string, 'asc' | 'desc'>
      | undefined;
    const sortDirection = orderBy?.createdAt ?? 'desc';

    rows.sort((a, b) => {
      const diff = a.created_at.getTime() - b.created_at.getTime();
      return sortDirection === 'asc' ? diff : -diff;
    });

    const total = rows.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + limit).map((row, index) => ({
      stt: start + index + 1,
      ...row,
    }));

    return {
      data,
      total,
    };
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
