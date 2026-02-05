import { Injectable } from '@nestjs/common';
import { payment_status, Prisma } from '@prisma/client';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

export enum PurchaseType {
  PURCHASE_ORDER = 'purchase_order',
  PURCHASE_RETURN = 'purchase_return',
}
@Injectable()
export class ReportSupplierService {
  private errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
  };

  constructor(private readonly prisma: PrismaService) {}
  async getReportSuppliers(
    storeId: string,
    query: Prisma.SupplierFindFirstArgs,
  ) {
    await this.checkStore(storeId);
    const where: Prisma.SupplierWhereInput = {
      AND: [query.where ?? {}, { store_id: storeId }],
    };
    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          purchase_orders: {
            include: {
              items: true,
              payments: true,
            },
          },
          purchase_return: {
            include: {
              items: true,
              payments: true,
            },
          },
        },
      }),
      this.prisma.supplier.count({
        where,
      }),
    ]);
    const reportSuppliers = suppliers.map((supplier) => {
      const purchaseOrders = supplier.purchase_orders;
      const totalPurchaseOrders = purchaseOrders.length;
      const totalPurchaseReturns = supplier.purchase_return.length;
      const totalProductsInPurchase = purchaseOrders.reduce((acc, item) => {
        return (
          acc +
          Number(
            item.items.reduce(
              (accItem, item) => accItem + Number(item.quantity),
              0,
            ),
          )
        );
      }, 0);

      const totalPurchasePaid = purchaseOrders.reduce(
        (acc, item) => acc + Number(item.total),
        0,
      );

      const totalPaid = purchaseOrders
        .filter((order) => {
          return order.payment_status === payment_status.PAID;
        })
        .reduce((acc, item) => acc + Number(item.total), 0);

      const totalUnpaidAmount = totalPurchasePaid - totalPaid;
      return {
        supplier_id: supplier.id,
        supplier_code: supplier.code,
        supplier_name: supplier.name,
        supplier_tax_code: supplier.tax_code,
        supplier_status: supplier.status,

        purchase_orders_code_numbers: purchaseOrders.map(
          (item) => item.order_number,
        ),
        purchase_return_code_numbers: supplier.purchase_return.map(
          (item) => item.return_number,
        ),
        total_purchase_returns: totalPurchaseReturns,
        total_products_in_purchase: totalProductsInPurchase,
        total_purchase_orders: totalPurchaseOrders,
        total_purchase_paid: totalPurchasePaid || supplier.total_purchased,
        total_paid: totalPaid,
        total_unpaid_amount: totalUnpaidAmount,
      };
    });
    return {
      data: reportSuppliers,
      total,
    };
  }

  async getReportSupplierDetail(
    storeId: string,
    supplierId: string,
    // page = 1,
    // limit = 10,
  ) {
    await this.checkStore(storeId);

    const [purchaseOrders, purchaseReturns] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: {
          supplier_id: supplierId,
        },
      }),

      this.prisma.purchaseReturn.findMany({
        where: {
          supplier_id: supplierId,
        },
      }),
    ]);
    const totalPurchaseOrders = purchaseOrders.length;
    const totalPurchaseReturns = purchaseReturns.length;

    const merged = [
      ...purchaseOrders.map((item) => ({
        id: item.id,
        code: item.order_number,
        amount: item.total,
        status: item.status,
        payment_status: item.payment_status,
        createdAt: item.createdAt,
        purchase_type: PurchaseType.PURCHASE_ORDER, // đơn nhập
      })),

      ...purchaseReturns.map((item) => ({
        id: item.id,
        code: item.return_number,
        amount: item.total,
        status: item.status,
        payment_status: item.payment_status,
        createdAt: item.createdAt,
        purchase_type: PurchaseType.PURCHASE_RETURN, // đơn xuất / trả
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // const total = merged.length;
    // const start = (page - 1) * limit;
    // const data = merged.slice(start, start + limit);

    return {
      data: merged,
      totalPurchaseOrders,
      totalPurchaseReturns,
      // pagination: {
      //   page,
      //   limit,
      //   total,
      //   totalPages: Math.ceil(total / limit),
      // },
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
