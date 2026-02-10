import { Injectable } from '@nestjs/common';
import { order_status, Prisma, purchase_return_status } from '@prisma/client';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  REPORT_CUSTOMERS_EXCEL_TEMPLATE,
  ReportCustomerExcel,
} from 'app/shared/excel-template/template/report-customer';
import {
  REPORT_ORDER_ITEMS_EXCEL_TEMPLATE,
  ReportOrderItemExcel,
} from 'app/shared/excel-template/template/report-order-item';
import {
  REPORT_ORDER_RETURN_EXCEL_TEMPLATE,
  ReportOrderReturnExcel,
} from 'app/shared/excel-template/template/report-order-return';
import {
  REPORT_PURCHASE_INVOICE_EXCEL_TEMPLATE,
  ReportPurchaseInvoiceExcel,
} from 'app/shared/excel-template/template/report-purchase-invoice';
import {
  REPORT_PURCHASE_RETURN_EXCEL_TEMPLATE,
  ReportPurchaseReturnExcel,
} from 'app/shared/excel-template/template/report-purchase-return';
import {
  REPORT_STOCK_EXCEL_TEMPLATE,
  ReportStockExcel,
} from 'app/shared/excel-template/template/report-stock';
import {
  REPORT_STOCK_LEDGER_EXCEL_TEMPLATE,
  ReportStockLedgerExcel,
} from 'app/shared/excel-template/template/report-stock-ledger';
import {
  REPORT_SUPPLIERS_EXCEL_TEMPLATE,
  ReportSupplierExcel,
} from 'app/shared/excel-template/template/report-supplier';
import {
  REPORT_STORE_MEMBER_EXCEL_TEMPLATE,
  ReportStoreMemberExcel,
} from 'app/shared/excel-template/template/rerport-store-member';

type SupplierWithOrders = Prisma.SupplierGetPayload<{
  include: { purchase_orders: true };
}>;
type CustomerWithOrders = Prisma.CustomerGetPayload<{
  include: { orders: true };
}>;
type OrderItemWithOrder = Prisma.OrderItemGetPayload<{
  include: {
    order: { include: { customer: true } };
    variant: true;
    product: true;
  };
}>;

type StoreMemberWithUser = Prisma.StoreMemberGetPayload<{
  include: {
    user: {
      include: {
        orders_cashier: true;
        username: true;
        email: true;
      };
    };
  };
}>;
type VariantStockWithVariant = Prisma.VariantStockGetPayload<{
  include: {
    variant: { include: { product: true } };
  };
}>;
type PurchaseReturnItemWithReturn = Prisma.PurchaseReturnItemGetPayload<{
  include: {
    purchase_return: true;
    variant: true;
    product: true;
  };
}>;
type OrderReturnItemWithReturn = Prisma.OrderReturnItemGetPayload<{
  include: {
    order_return: true;
    variant: true;
    product: true;
  };
}>;
type PurchaseOrderItemWithOrder = Prisma.PurchaseOrderItemGetPayload<{
  include: {
    purchase_order: true;
    variant: true;
    product: true;
  };
}>;
type OrderItemWithOrderInfo = Prisma.OrderItemGetPayload<{
  include: {
    order: true;
    variant: true;
    product: true;
  };
}>;
type PurchaseOrderWithSupplier = Prisma.PurchaseOrderGetPayload<{
  include: {
    supplier: true;
  };
}>;
type PurchaseReturnWithSupplier = Prisma.PurchaseReturnGetPayload<{
  include: {
    supplier: true;
  };
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

  async exportReportOrderItems(storeId: string) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          store_id: storeId,
        },
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        variant: true,
        product: true,
      },
      orderBy: {
        order: {
          createdAt: 'desc',
        },
      },
    });

    const rows = this.flattenOrderItemData(orderItems);
    return this.excelService.exportData(
      REPORT_ORDER_ITEMS_EXCEL_TEMPLATE,
      rows,
    );
  }
  async exportReportStoreMembers(storeId: string) {
    const storeMembers = await this.prisma.storeMember.findMany({
      where: {
        storeId: storeId,
      },
      include: {
        user: {
          include: {
            orders_cashier: true,
          },
        },
      },
    });
    const rows = this.flattenStoreMemberData(storeMembers);
    return this.excelService.exportData(
      REPORT_STORE_MEMBER_EXCEL_TEMPLATE,
      rows,
    );
  }

  async exportReportStocks(storeId: string) {
    const stocks = await this.prisma.variantStock.findMany({
      where: {
        store_id: storeId,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const rows = this.flattenStockData(stocks);
    return this.excelService.exportData(REPORT_STOCK_EXCEL_TEMPLATE, rows);
  }

  async exportReportStockLedger(storeId: string) {
    const [purchaseItems, orderItems] = await Promise.all([
      this.prisma.purchaseOrderItem.findMany({
        where: {
          purchase_order: {
            store_id: storeId,
          },
        },
        include: {
          purchase_order: true,
          product: true,
          variant: true,
        },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            store_id: storeId,
          },
        },
        include: {
          order: true,
          product: true,
          variant: true,
        },
      }),
    ]);

    const rows = this.flattenStockLedgerData(purchaseItems, orderItems);
    return this.excelService.exportData(
      REPORT_STOCK_LEDGER_EXCEL_TEMPLATE,
      rows,
    );
  }

  async exportReportPurchaseReturns(storeId: string) {
    const items = await this.prisma.purchaseReturnItem.findMany({
      where: {
        purchase_return: {
          store_id: storeId,
        },
      },
      include: {
        purchase_return: true,
        variant: true,
        product: true,
      },
      orderBy: {
        purchase_return: {
          createdAt: 'desc',
        },
      },
    });

    const rows = this.flattenPurchaseReturnData(items);
    return this.excelService.exportData(
      REPORT_PURCHASE_RETURN_EXCEL_TEMPLATE,
      rows,
    );
  }

  async exportReportPurchaseInvoices(storeId: string) {
    const [purchaseOrders, purchaseReturns] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { store_id: storeId },
        include: { supplier: true },
      }),
      this.prisma.purchaseReturn.findMany({
        where: { store_id: storeId },
        include: { supplier: true },
      }),
    ]);

    const rows = this.flattenPurchaseInvoiceData(
      purchaseOrders,
      purchaseReturns,
    );

    return this.excelService.exportData(
      REPORT_PURCHASE_INVOICE_EXCEL_TEMPLATE,
      rows,
    );
  }

  async exportReportOrderReturns(storeId: string) {
    const items = await this.prisma.orderReturnItem.findMany({
      where: {
        order_return: {
          store_id: storeId,
        },
      },
      include: {
        order_return: true,
        variant: true,
        product: true,
      },
      orderBy: {
        order_return: {
          createdAt: 'desc',
        },
      },
    });

    const rows = this.flattenOrderReturnData(items);
    return this.excelService.exportData(
      REPORT_ORDER_RETURN_EXCEL_TEMPLATE,
      rows,
    );
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

  private flattenOrderItemData(orderItems: OrderItemWithOrder[]) {
    const rows: ReportOrderItemExcel[] = [];

    orderItems.forEach((item, index) => {
      rows.push({
        stt: index + 1,
        order_date: this.format.formatDate(item.order.createdAt),
        order_code: item.order.code || '',
        customer_name:
          item.order.customer_name || item.order.customer?.name || '',
        order_total_amount: this.format.formatCurrency(item.order.total_amount),
        variant_name: item.variant?.name || '',
        product_name: item.product?.name || '',
        base_unit: item.product?.baseUnit || '',
        quantity: item.quantity,
        price: this.format.formatCurrency(item.price),
        line_total: this.format.formatCurrency(item.total),
      });
    });

    return rows;
  }

  private flattenStoreMemberData(storeMembers: StoreMemberWithUser[]) {
    const rows: ReportStoreMemberExcel[] = [];

    storeMembers.forEach((member) => {
      rows.push({
        member_name: member.user.username || '',
        member_email: member.user.email || '',
        total_orders: member.user.orders_cashier.length.toString(),
        total_order_success: member.user.orders_cashier
          .filter((order) => order.status === order_status.COMPLETED)
          .length.toString(),
        total_order_price: this.format.formatCurrency(
          member.user.orders_cashier.reduce(
            (total, order) => total + order.total_amount,
            0,
          ),
        ),
        total_price_amount: this.format.formatCurrency(
          member.user.orders_cashier.reduce(
            (total, order) => total + order.customer_pay_amount,
            0,
          ),
        ),
        created_at: this.format.formatDate(member.createdAt),
      });
    });

    return rows;
  }

  private flattenStockData(stocks: VariantStockWithVariant[]) {
    const rows: ReportStockExcel[] = [];

    stocks.forEach((item, index) => {
      const onHand = Number(item.onHand ?? 0);
      const cost = Number(item.variant?.cost ?? 0);
      rows.push({
        stt: index + 1,
        variant_name: item.variant?.name || '',
        product_name: item.variant?.product?.name || '',
        sku: item.variant?.sku || '',
        base_unit: item.variant?.product?.baseUnit || '',
        on_hand: onHand,
        reserved: Number(item.reserved ?? 0),
        damaged: Number(item.damaged ?? 0),
        price: this.format.formatCurrency(item.variant?.price ?? 0),
        cost: this.format.formatCurrency(cost),
        stock_value: this.format.formatCurrency(onHand * cost),
      });
    });

    return rows;
  }

  private flattenStockLedgerData(
    purchaseItems: PurchaseOrderItemWithOrder[],
    orderItems: OrderItemWithOrderInfo[],
  ) {
    const rows: Array<ReportStockLedgerExcel & { rawDate: Date }> = [];

    purchaseItems.forEach((item) => {
      const quantity = Number(item.total_base_qty ?? item.quantity ?? 0);
      rows.push({
        stt: 0,
        created_at: this.format.formatDate(item.purchase_order.order_date),
        code: item.purchase_order.order_number,
        type: 'NHẬP',
        partner_name: item.purchase_order.supplier_name || '',
        variant_name: item.variant?.name || item.item_name || '',
        product_name: item.product?.name || '',
        base_unit: item.product?.baseUnit || '',
        quantity_in: quantity,
        quantity_out: 0,
        unit_price: this.format.formatCurrency(item.unit_cost ?? 0),
        line_total: this.format.formatCurrency(item.total ?? 0),
        rawDate: item.purchase_order.order_date,
      });
    });

    orderItems.forEach((item) => {
      rows.push({
        stt: 0,
        created_at: this.format.formatDate(item.order.createdAt),
        code: item.order.code || '',
        type: 'XUẤT',
        partner_name: item.order.customer_name || '',
        variant_name: item.variant?.name || '',
        product_name: item.product?.name || '',
        base_unit: item.product?.baseUnit || '',
        quantity_in: 0,
        quantity_out: Number(item.quantity ?? 0),
        unit_price: this.format.formatCurrency(item.price ?? 0),
        line_total: this.format.formatCurrency(item.total ?? 0),
        rawDate: item.order.createdAt,
      });
    });

    rows.sort((a, b) => {
      return b.rawDate.getTime() - a.rawDate.getTime();
    });

    return rows.map(({ ...row }, index) => ({
      ...row,
      stt: index + 1,
    }));
  }

  private flattenPurchaseReturnData(items: PurchaseReturnItemWithReturn[]) {
    const rows: ReportPurchaseReturnExcel[] = [];

    items.forEach((item, index) => {
      rows.push({
        stt: index + 1,
        return_date: this.format.formatDate(item.purchase_return.return_date),
        return_number: item.purchase_return.return_number,
        supplier_name: item.purchase_return.supplier_name || '',
        supplier_code: item.purchase_return.supplier_code || '',
        status: String(item.purchase_return.status || ''),
        payment_status: this.status.paymentStatus(
          item.purchase_return.payment_status,
        ),
        total_return: this.format.formatCurrency(
          item.purchase_return.total ?? 0,
        ),
        variant_name: item.variant?.name || item.item_name || '',
        product_name: item.product?.name || '',
        base_unit: item.product?.baseUnit || '',
        quantity: Number(item.quantity ?? 0),
        unit_cost: this.format.formatCurrency(item.unit_cost ?? 0),
        line_total: this.format.formatCurrency(item.total ?? 0),
        reason: item.reason || '',
      });
    });

    return rows;
  }

  private flattenOrderReturnData(items: OrderReturnItemWithReturn[]) {
    const rows: ReportOrderReturnExcel[] = [];

    items.forEach((item, index) => {
      rows.push({
        stt: index + 1,
        return_date: this.format.formatDate(item.order_return.createdAt),
        return_number: item.order_return.order_return_number,
        order_number: item.order_return.order_number,
        customer_name: item.order_return.customer_name || '',
        return_status: String(item.order_return.return_status || ''),
        return_type: String(item.order_return.return_type || ''),
        total_return: this.format.formatCurrency(item.order_return.total ?? 0),
        variant_name: item.variant?.name || item.item_name || '',
        product_name: item.product?.name || '',
        base_unit: item.product?.baseUnit || '',
        quantity: Number(item.quantity ?? 0),
        line_total: this.format.formatCurrency(item.total ?? 0),
        reason_status: String(item.reason_status || ''),
        condition: item.condition || '',
      });
    });

    return rows;
  }

  private flattenPurchaseInvoiceData(
    purchaseOrders: PurchaseOrderWithSupplier[],
    purchaseReturns: PurchaseReturnWithSupplier[],
  ) {
    const rows: Array<ReportPurchaseInvoiceExcel & { rawDate: Date }> = [];

    purchaseOrders.forEach((order) => {
      rows.push({
        supplier_code: order.supplier_code || order.supplier?.code || '',
        supplier_name: order.supplier_name || order.supplier?.name || '',
        invoice_type: 'NHẬP',
        invoice_code: order.order_number,
        status: this.status.purchaseOrderStatus(order.status),
        payment_status: this.status.paymentStatus(order.payment_status),
        payment_method: order.payment_method
          ? this.status.paymentMethod(order.payment_method)
          : '',
        invoice_date: this.format.formatDate(order.order_date),
        total_amount: this.format.formatCurrency(order.total ?? 0),
        note: order.notes || '',
        rawDate: order.order_date,
      });
    });

    purchaseReturns.forEach((ret) => {
      rows.push({
        supplier_code: ret.supplier_code || ret.supplier?.code || '',
        supplier_name: ret.supplier_name || ret.supplier?.name || '',
        invoice_type: 'TRẢ',
        invoice_code: ret.return_number,
        status: this.formatPurchaseReturnStatus(ret.status),
        payment_status: this.status.paymentStatus(ret.payment_status),
        payment_method: '',
        invoice_date: this.format.formatDate(ret.return_date),
        total_amount: this.format.formatCurrency(ret.total ?? 0),
        note: ret.reason || ret.notes || '',
        rawDate: ret.return_date,
      });
    });

    rows.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    return rows.map(({ ...row }) => row);
  }

  private formatPurchaseReturnStatus(status: purchase_return_status) {
    const map: Record<purchase_return_status, string> = {
      DRAFT: 'Nháp',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return map[status];
  }
}
