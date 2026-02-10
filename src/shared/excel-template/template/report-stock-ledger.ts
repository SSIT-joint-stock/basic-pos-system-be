import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportStockLedgerExcel {
  stt: number;
  created_at: string;
  code: string;
  type: string;
  partner_name: string;
  variant_name: string;
  product_name: string;
  base_unit: string;
  quantity_in: number;
  quantity_out: number;
  unit_price: string;
  line_total: string;
}

export const REPORT_STOCK_LEDGER_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Sổ kho',
  fileName: 'bao_cao_so_kho.xlsx',
  headerGroups: [
    {
      title: 'Chứng từ',
      columns: [
        { header: 'STT', key: 'stt', width: 8, merge: false },
        { header: 'Thời gian', key: 'created_at', width: 20, merge: false },
        { header: 'Mã chứng từ', key: 'code', width: 16, merge: false },
        { header: 'Loại', key: 'type', width: 12, merge: false },
        { header: 'Đối tác', key: 'partner_name', width: 24, merge: false },
      ],
    },
    {
      title: 'Sản phẩm',
      columns: [
        {
          header: 'Tên sản phẩm (biến thể)',
          key: 'variant_name',
          width: 28,
          merge: false,
        },
        {
          header: 'Sản phẩm gốc',
          key: 'product_name',
          width: 24,
          merge: false,
        },
        { header: 'Đơn vị', key: 'base_unit', width: 12, merge: false },
      ],
    },
    {
      title: 'Số lượng',
      columns: [
        { header: 'Nhập', key: 'quantity_in', width: 12, merge: false },
        { header: 'Xuất', key: 'quantity_out', width: 12, merge: false },
      ],
    },
    {
      title: 'Giá trị',
      columns: [
        { header: 'Đơn giá', key: 'unit_price', width: 16, merge: false },
        { header: 'Thành tiền', key: 'line_total', width: 16, merge: false },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
