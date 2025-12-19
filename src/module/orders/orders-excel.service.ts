import { Injectable } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { ORDER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/order';

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
            tax_rate: true,
            discount_rate: true,
            price: true,
            variant: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
    const data = orders.map((order) => ({
      code: order.code ?? '',
      createdAt:
        this.format.formatDate(order.createdAt, { showTime: true }) ?? '',
      status: this.status.statusOrdersLabels[order.status] ?? '',

      customer_name: order.customer?.name ?? '',
      email: order.customer?.email ?? '',
      phone: order.customer?.phone ?? '',

      product_name:
        order.order_item.map((item) => item.variant.name).join(', ') ?? '',
      quantity: order.order_item.map((item) => item.quantity).join(', ') ?? '',
      price:
        order.order_item
          .map((item) => this.format.formatCurrency(item.price))
          .join(', ') ?? '',

      total: this.format.formatCurrency(order.total_amount) ?? '',
      paid: this.format.formatCurrency(order.customer_pay_amount) ?? '',
      remain:
        this.format.formatCurrency(
          order.total_amount - order.customer_pay_amount,
        ) || 0,
    }));

    return this.excelService.exportData(ORDER_EXCEL_TEMPLATE, data);
  }

  async importOrders() {}
}
