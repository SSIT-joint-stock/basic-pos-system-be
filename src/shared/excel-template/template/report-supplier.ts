import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportSupplierExcel {
  supplier_code: string;
  supplier_name: string;
  supplier_tax: string;
  order_code: string;
  note: string;
  status: string;
  payment_status: string;
  payment_method: string;
  order_date: string;
  total_amount: string;
}
export const REPORT_SUPPLIERS_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Báo cáo NCC',
  fileName: 'bao_cao_ncc.xlsx',
  headerGroups: [
    {
      title: 'Nhà cung cấp',
      columns: [
        { header: 'Mã NCC', key: 'supplier_code', width: 16, merge: true },
        { header: 'Tên NCC', key: 'supplier_name', merge: true },
        { header: 'Mã số thuế', key: 'supplier_tax', width: 24, merge: true },
      ],
    },
    {
      title: 'Đơn nhập',
      columns: [
        { header: 'Mã đơn', key: 'order_code', width: 16, merge: false },
        { header: 'Trạng thái', key: 'status', width: 18, merge: false },
        {
          header: 'Thanh toán',
          key: 'payment_status',
          width: 18,
          merge: false,
        },
        {
          header: 'Phương thức',
          key: 'payment_method',
          width: 18,
          merge: false,
        },
        { header: 'Ngày', key: 'order_date', width: 18, merge: false },
        { header: 'Tổng tiền', key: 'total_amount', width: 16, merge: false },
        { header: 'Ghi chú', key: 'quantity', merge: false },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
