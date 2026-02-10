import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FilterParseResult } from 'app/common/decorators/filter-parse.decorator';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class ReportPurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  private errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
  };

  async getReportPurchaseReturns(
    storeId: string,
    query: Prisma.PurchaseReturnFindManyArgs,
  ) {
    await this.checkStore(storeId);

    const baseWhere = query.where ?? {};
    const returnWhere: Prisma.PurchaseReturnWhereInput = {
      AND: [baseWhere, { store_id: storeId }],
    };

    const orderBy = this.mapOrderBy(
      query.orderBy as Record<string, Prisma.SortOrder> | undefined,
    );

    const [items, total] = await Promise.all([
      this.prisma.purchaseReturnItem.findMany({
        where: {
          purchase_return: returnWhere,
        },
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          purchase_return: {
            select: {
              return_number: true,
              return_date: true,
              supplier_name: true,
              supplier_code: true,
              status: true,
              payment_status: true,
              total: true,
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
      this.prisma.purchaseReturnItem.count({
        where: {
          purchase_return: returnWhere,
        },
      }),
    ]);

    const offset = query.skip ?? 0;
    const rows = items.map((item, index) => ({
      stt: offset + index + 1,
      return_date: item.purchase_return.return_date,
      return_number: item.purchase_return.return_number,
      supplier_name: item.purchase_return.supplier_name || '',
      supplier_code: item.purchase_return.supplier_code || '',
      status: item.purchase_return.status,
      payment_status: item.purchase_return.payment_status,
      total_return: Number(item.purchase_return.total ?? 0),
      variant_name: item.variant?.name || item.item_name || '',
      product_name: item.product?.name || '',
      base_unit: item.product?.baseUnit || '',
      quantity: Number(item.quantity ?? 0),
      unit_cost: Number(item.unit_cost ?? 0),
      line_total: Number(item.total ?? 0),
      reason: item.reason || '',
    }));

    return {
      data: rows,
      total,
    };
  }

  async getReportPurchaseInvoices(
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

    const [purchaseOrders, purchaseReturns] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: {
          store_id: storeId,
          ...(dateFilter ? { order_date: dateFilter } : {}),
        },
        include: {
          supplier: true,
        },
      }),
      this.prisma.purchaseReturn.findMany({
        where: {
          store_id: storeId,
          ...(dateFilter ? { return_date: dateFilter } : {}),
        },
        include: {
          supplier: true,
        },
      }),
    ]);

    let rows = [
      ...purchaseOrders.map((order) => ({
        date: order.order_date,
        invoice_type: 'NHẬP',
        invoice_code: order.order_number,
        supplier_name: order.supplier_name || order.supplier?.name || '',
        supplier_code: order.supplier_code || order.supplier?.code || '',
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: Number(order.total ?? 0),
        note: order.notes || '',
      })),
      ...purchaseReturns.map((ret) => ({
        date: ret.return_date,
        invoice_type: 'TRẢ',
        invoice_code: ret.return_number,
        supplier_name: ret.supplier_name || ret.supplier?.name || '',
        supplier_code: ret.supplier_code || ret.supplier?.code || '',
        status: ret.status,
        payment_status: ret.payment_status,
        payment_method: null,
        total_amount: Number(ret.total ?? 0),
        note: ret.reason || ret.notes || '',
      })),
    ];

    if (search && search.trim()) {
      const keyword = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        [row.invoice_code, row.supplier_name, row.supplier_code]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword)),
      );
    }

    const orderBy = query.prismaQuery.orderBy as
      | Record<string, 'asc' | 'desc'>
      | undefined;
    const sortKey = orderBy ? Object.keys(orderBy)[0] : 'createdAt';
    const sortDir = orderBy ? orderBy[sortKey] : 'desc';

    rows.sort((a, b) => {
      if (sortKey === 'code') {
        return sortDir === 'asc'
          ? a.invoice_code.localeCompare(b.invoice_code)
          : b.invoice_code.localeCompare(a.invoice_code);
      }
      if (sortKey === 'supplier_name') {
        return sortDir === 'asc'
          ? a.supplier_name.localeCompare(b.supplier_name)
          : b.supplier_name.localeCompare(a.supplier_name);
      }
      const diff = a.date.getTime() - b.date.getTime();
      return sortDir === 'asc' ? diff : -diff;
    });

    const total = rows.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + limit).map((row, index) => ({
      stt: start + index + 1,
      ...row,
    }));

    return { data, total };
  }

  private mapOrderBy(
    orderBy?: Record<string, Prisma.SortOrder>,
  ): Prisma.PurchaseReturnItemOrderByWithRelationInput {
    const defaultSort: Prisma.SortOrder = 'desc';

    if (!orderBy) {
      return { purchase_return: { createdAt: defaultSort } };
    }

    if (orderBy.createdAt) {
      return { purchase_return: { createdAt: orderBy.createdAt } };
    }

    if (orderBy.return_number) {
      return { purchase_return: { return_number: orderBy.return_number } };
    }

    if (orderBy.supplier_name) {
      return { purchase_return: { supplier_name: orderBy.supplier_name } };
    }

    return { purchase_return: { createdAt: defaultSort } };
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
