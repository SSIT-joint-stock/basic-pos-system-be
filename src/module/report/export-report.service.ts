import { Injectable } from '@nestjs/common';
import { order_status, Prisma } from '@prisma/client';
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
  REPORT_SUPPLIERS_EXCEL_TEMPLATE,
  ReportSupplierExcel,
} from 'app/shared/excel-template/template/report-supplier';
import { ReportStoreMemberExcel } from 'app/shared/excel-template/template/rerport-store-member';

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
}
