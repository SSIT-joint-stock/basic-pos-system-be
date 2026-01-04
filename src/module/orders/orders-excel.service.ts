import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  ORDER_EXCEL_TEMPLATE,
  OrderExcel,
} from 'app/shared/excel-template/template/order';

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    order_item: {
      select: {
        quantity: true;
        price: true;
        tax_rate: true;
        discount_rate: true;
        variant: true;
      };
    };
    customer: true;
    cashier: true;
  };
}>;
@Injectable()
export class OrdersExcelService {
  constructor(
    private readonly excelService: ExcelTemplateService,
    private readonly prisma: PrismaService,
    private readonly format: Format,
    private readonly status: FormatStatus,
  ) {}
  async downloadExampleOrder() {
    return this.excelService.generateTemplateExample(ORDER_EXCEL_TEMPLATE);
  }

  async exportOrders(storeId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        store_id: storeId,
      },
      include: {
        order_item: {
          select: {
            quantity: true,
            price: true,
            tax_rate: true,
            discount_rate: true,
            variant: true,
          },
        },
        customer: true,
        cashier: true,
      },
    });
    const rows = this.flattenOrderData(orders);
    return this.excelService.exportData(ORDER_EXCEL_TEMPLATE, rows);
  }

  async importOrders() {}

  private flattenOrderData(orders: OrderWithItems[]) {
    const rows: OrderExcel[] = [];
    orders.forEach((order) => {
      order.order_item.forEach((item) => {
        rows.push({
          code: order.code || '',
          createdAt: this.format.formatDate(order.createdAt) || '',
          status: this.status.orderStatus(order.status) || '',
          payment_method: this.status.paymentMethod(order.payment_method) || '',

          customer_name: order.customer_name || '',
          email: order.customer?.email || '',
          phone: order.customer?.phone || '',

          product_name: item.variant.name || '',
          quantity: item.quantity,
          price: this.format.formatCurrency(item.price),

          total: this.format.formatCurrency(order.total_amount) || '',
          paid: this.format.formatCurrency(order.customer_pay_amount) || '',
          remain:
            this.format.formatCurrency(
              order.total_amount - order.customer_pay_amount,
            ) || '',
        });
      });
    });
    return rows;
  }
}
