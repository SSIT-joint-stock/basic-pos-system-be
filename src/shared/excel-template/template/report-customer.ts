import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportCustomerExcel {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_code: string;
  status: string;
  payment_method: string;
  order_date: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
}
export const REPORT_CUSTOMERS_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Báo cáo KH',
  fileName: 'bao_cao_kh.xlsx',
  headerGroups: [
    {
      title: 'Khách hàng',
      columns: [
        { header: 'Tên KH', key: 'customer_name', width: 24, merge: true },
        {
          header: 'Số điện thoại',
          key: 'customer_phone',
          width: 24,
          merge: true,
        },
        { header: 'Email', key: 'supplier_tax', width: 24, merge: true },
      ],
    },
    {
      title: 'Đơn hàng',
      columns: [
        { header: 'Mã đơn', key: 'order_code', width: 16, merge: false },
        { header: 'Trạng thái', key: 'status', width: 18, merge: false },
        {
          header: 'Phương thức',
          key: 'payment_method',
          width: 18,
          merge: false,
        },
        { header: 'Thuế (%)', key: 'tax_amount', width: 18, merge: false },
        {
          header: 'Chiết khấu (%)',
          key: 'discount_amount',
          width: 18,
          merge: false,
        },
        { header: 'Tổng tiền', key: 'total_amount', width: 16, merge: false },
        { header: 'Ngày', key: 'order_date', width: 18, merge: false },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
