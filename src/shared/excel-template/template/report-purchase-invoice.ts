import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportPurchaseInvoiceExcel {
  supplier_code: string;
  supplier_name: string;
  invoice_type: string;
  invoice_code: string;
  status: string;
  payment_status: string;
  payment_method: string;
  invoice_date: string;
  total_amount: string;
  note: string;
}

export const REPORT_PURCHASE_INVOICE_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'HD NCC',
  fileName: 'hoa_don_ncc.xlsx',
  headerGroups: [
    {
      title: 'Nhà cung cấp',
      columns: [
        { header: 'Mã NCC', key: 'supplier_code', width: 16, merge: true },
        { header: 'Tên NCC', key: 'supplier_name', width: 24, merge: true },
      ],
    },
    {
      title: 'Hóa đơn',
      columns: [
        { header: 'Loại', key: 'invoice_type', width: 12, merge: false },
        { header: 'Mã chứng từ', key: 'invoice_code', width: 18, merge: false },
        { header: 'Trạng thái', key: 'status', width: 14, merge: false },
        {
          header: 'Thanh toán',
          key: 'payment_status',
          width: 14,
          merge: false,
        },
        {
          header: 'Phương thức',
          key: 'payment_method',
          width: 16,
          merge: false,
        },
        { header: 'Ngày', key: 'invoice_date', width: 18, merge: false },
        { header: 'Tổng tiền', key: 'total_amount', width: 16, merge: false },
        { header: 'Ghi chú', key: 'note', width: 24, merge: false },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
