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
        { header: 'Mã NCC', key: 'supplier_code', width: 16 },
        { header: 'Tên NCC', key: 'supplier_name' },
        { header: 'MST', key: 'supplier_tax', width: 16 },
      ],
    },
    {
      title: 'Đơn nhập',
      columns: [
        { header: 'Mã đơn', key: 'order_code', width: 16 },
        { header: 'Trạng thái', key: 'status', width: 18 },
        { header: 'Thanh toán', key: 'payment_status', width: 18 },
        { header: 'Phương thức', key: 'payment_method', width: 18 },
        { header: 'Ngày', key: 'order_date', width: 18 },
        { header: 'Tổng tiền', key: 'total_amount', width: 16 },
        { header: 'Ghi chú', key: 'quantity' },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
