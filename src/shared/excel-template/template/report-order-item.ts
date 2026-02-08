import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportOrderItemExcel {
  stt: number;
  order_date: string;
  order_code: string;
  customer_name: string;
  order_total_amount: string;
  variant_name: string;
  product_name: string;
  base_unit: string;
  quantity: number;
  price: string;
  line_total: string;
}

export const REPORT_ORDER_ITEMS_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Báo cáo dòng SP',
  fileName: 'bao_cao_dong_san_pham.xlsx',
  headerGroups: [
    {
      title: 'Đơn hàng',
      columns: [
        { header: 'STT', key: 'stt', width: 8, merge: false },
        { header: 'Thời gian', key: 'order_date', width: 20, merge: false },
        { header: 'Mã hóa đơn', key: 'order_code', width: 16, merge: false },
        {
          header: 'Tên khách hàng',
          key: 'customer_name',
          width: 24,
          merge: false,
        },
        {
          header: 'Tổng tiền hóa đơn',
          key: 'order_total_amount',
          width: 20,
          merge: false,
        },
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
      title: 'Dòng sản phẩm',
      columns: [
        { header: 'Số lượng', key: 'quantity', width: 12, merge: false },
        { header: 'Đơn giá', key: 'price', width: 16, merge: false },
        { header: 'Thành tiền', key: 'line_total', width: 16, merge: false },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
