import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  REPORT_SUPPLIERS_EXCEL_TEMPLATE,
  ReportSupplierExcel,
} from 'app/shared/excel-template/template/report-supplier';

type SupplierWithOrders = Prisma.SupplierGetPayload<{
  include: { purchase_orders: true };
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
  private flattenSupplierData(suppliers: SupplierWithOrders[]) {
    const rows: ReportSupplierExcel[] = [];

    suppliers.forEach((supplier) => {
      supplier.purchase_orders.forEach((order, index) => {
        rows.push({
          supplier_code: index === 0 ? supplier.code || '' : '',
          supplier_name: index === 0 ? supplier.name || '' : '',
          supplier_tax: index === 0 ? supplier.tax_code || '' : '',

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
}
