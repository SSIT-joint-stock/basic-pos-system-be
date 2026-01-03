import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  REPORT_CUSTOMERS_EXCEL_TEMPLATE,
  ReportCustomerExcel,
} from 'app/shared/excel-template/template/report-customer';
import {
  REPORT_SUPPLIERS_EXCEL_TEMPLATE,
  ReportSupplierExcel,
} from 'app/shared/excel-template/template/report-supplier';

type SupplierWithOrders = Prisma.SupplierGetPayload<{
  include: { purchase_orders: true };
}>;
type CustomerWithOrders = Prisma.CustomerGetPayload<{
  include: { orders: true };
}>;

@Injectable()
export class ExportReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelTemplateService,
    private readonly format: Format,
    private readonly status: FormatStatus,
  ) {}
  async exportReportSuppliers(storeId: string) {
    // only get supplier with orders in store
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        store_id: storeId,
      },
      include: {
        purchase_orders: true,
      },
    });

    const rows = this.flattenSupplierData(suppliers);

    return this.excelService.exportData(REPORT_SUPPLIERS_EXCEL_TEMPLATE, rows);
  }
  async exportReportCustomers(storeId: string) {
    const customer = await this.prisma.customer.findMany({
      where: {
        store_id: storeId,
      },
      include: {
        orders: true,
      },
    });
    const rows = this.flattenCustomerData(customer);

    return this.excelService.exportData(REPORT_CUSTOMERS_EXCEL_TEMPLATE, rows);
  }
  private flattenSupplierData(suppliers: SupplierWithOrders[]) {
    const rows: ReportSupplierExcel[] = [];

    suppliers.forEach((supplier) => {
      supplier.purchase_orders.forEach((order) => {
        rows.push({
          supplier_code: supplier.code || '',
          supplier_name: supplier.name || '',
          supplier_tax: supplier.tax_code || '',

          order_code: order.order_number,
          note: order.notes || '',
          payment_method:
            (order.payment_method &&
              this.status.paymentMethod(order.payment_method)) ||
            '',
          payment_status: this.status.paymentStatus(order.payment_status) || '',
          status: this.status.purchaseOrderStatus(order.status) || '',
          order_date: this.format.formatDate(order.order_date),
          total_amount: this.format.formatCurrency(order.total),
        });
      });
    });

    return rows;
  }

  private flattenCustomerData(customers: CustomerWithOrders[]) {
    const rows: ReportCustomerExcel[] = [];

    customers.forEach((customer) => {
      customer.orders.forEach((order) => {
        rows.push({
          customer_name: customer.name || '',
          customer_email: customer.email || '',
          customer_phone: customer.phone || '',

          order_code: order.code || '',
          payment_method:
            (order.payment_method &&
              this.status.paymentMethod(order.payment_method)) ||
            '',
          tax_amount: this.format.formatCurrency(order.tax_amount),
          discount_amount: this.format.formatCurrency(order.discount_amount),
          status: this.status.orderStatus(order.status) || '',
          order_date: this.format.formatDate(order.createdAt),
          total_amount: this.format.formatCurrency(order.total_amount),
        });
      });
    });

    return rows;
  }
}
