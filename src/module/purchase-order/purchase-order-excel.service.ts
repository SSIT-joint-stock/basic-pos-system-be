import { Injectable } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { EXAMPLE_PURCHASE_ORDER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/example-purchase-order';
import { PURCHASE_ORDER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/purchase-order';

@Injectable()
export class PurchaseOrderExcelService {
  constructor(
    private readonly excelService: ExcelTemplateService,
    private readonly prisma: PrismaService,
    private readonly format: Format,
    private readonly status: FormatStatus,
  ) {}
  async downloadExamplePurchaseOrder() {
    return this.excelService.generateTemplateExample(
      EXAMPLE_PURCHASE_ORDER_EXCEL_TEMPLATE,
    );
  }

  async exportPurchaseOrders(storeId: string) {
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        store_id: storeId,
      },
      include: {
        supplier: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        order_date: 'desc',
      },
    });

    const data = purchaseOrders.map((po) => ({
      // ===== Thông tin phiếu nhập =====
      order_number: po.order_number,
      order_date: this.format.formatDate(po.order_date),
      expected_date: po.expected_date
        ? this.format.formatDate(po.expected_date)
        : '',
      received_date: po.received_date
        ? this.format.formatDate(po.received_date)
        : '',

      // ===== Nhà cung cấp =====
      supplier_code: po.supplier?.code ?? '',
      supplier_name: po.supplier?.name ?? '',

      // ===== Trạng thái =====
      status: this.status.purchaseOrderStatus(po.status),
      payment_status: this.status.paymentStatus(po.payment_status),
      payment_method: po.payment_method
        ? this.status.paymentMethod(po.payment_method)
        : '',

      // ===== Tài chính (GIỮ NGUYÊN NUMBER) =====
      subtotal: Number(po.subtotal),
      discount_amount: Number(po.discount_amount),
      tax_amount: Number(po.tax_amount),
      shipping_fee: Number(po.shipping_fee ?? 0),
      total: Number(po.total),
      paid_amount: Number(po.paid_amount),
      remain_amount: Number(po.total) - Number(po.paid_amount),

      // ===== Ghi chú =====
      notes: po.notes ?? '',
    }));

    return this.excelService.exportData(PURCHASE_ORDER_EXCEL_TEMPLATE, data);
  }
}
