import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportStockExcel {
  stt: number;
  variant_name: string;
  product_name: string;
  sku: string;
  base_unit: string;
  on_hand: number;
  reserved: number;
  damaged: number;
  price: string;
  cost: string;
  stock_value: string;
}

export const REPORT_STOCK_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Báo cáo tồn kho',
  fileName: 'bao_cao_ton_kho.xlsx',
  headerGroups: [
    {
      title: 'Sản phẩm',
      columns: [
        { header: 'STT', key: 'stt', width: 8, merge: false },
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
        { header: 'SKU', key: 'sku', width: 16, merge: false },
        { header: 'Đơn vị', key: 'base_unit', width: 12, merge: false },
      ],
    },
    {
      title: 'Tồn kho',
      columns: [
        { header: 'Tồn thực tế', key: 'on_hand', width: 14, merge: false },
        { header: 'Giữ chỗ', key: 'reserved', width: 12, merge: false },
        { header: 'Hư hỏng', key: 'damaged', width: 12, merge: false },
      ],
    },
    {
      title: 'Giá trị',
      columns: [
        { header: 'Giá bán', key: 'price', width: 16, merge: false },
        { header: 'Giá vốn', key: 'cost', width: 16, merge: false },
        { header: 'Giá trị tồn', key: 'stock_value', width: 18, merge: false },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
