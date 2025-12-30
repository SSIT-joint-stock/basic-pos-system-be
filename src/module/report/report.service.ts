import { Injectable } from '@nestjs/common';
import { payment_status, Prisma } from '@prisma/client';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}
  private errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng!',
  };

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
        },
      }),
      this.prisma.supplier.count({
        where,
      }),
    ]);
    const reportSuppliers = suppliers.map((supplier) => {
      const purchaseOrders = supplier.purchase_orders;
      const totalPurchaseOrders = purchaseOrders.length;
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
