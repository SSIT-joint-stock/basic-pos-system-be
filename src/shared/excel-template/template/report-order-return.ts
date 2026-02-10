import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportOrderReturnExcel {
  stt: number;
  return_date: string;
  return_number: string;
  order_number: string;
  customer_name: string;
  return_status: string;
  return_type: string;
  total_return: string;
  variant_name: string;
  product_name: string;
  base_unit: string;
  quantity: number;
  line_total: string;
  reason_status: string;
  condition: string;
}

export const REPORT_ORDER_RETURN_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Trả KH',
  fileName: 'bao_cao_tra_kh.xlsx',
  headerGroups: [
    {
      title: 'Phiếu trả KH',
      columns: [
        { header: 'STT', key: 'stt', width: 8, merge: false },
        { header: 'Ngày trả', key: 'return_date', width: 20, merge: false },
        {
          header: 'Mã trả hàng',
          key: 'return_number',
          width: 18,
          merge: false,
        },
        {
          header: 'Mã hóa đơn',
          key: 'order_number',
          width: 16,
          merge: false,
        },
        {
          header: 'Khách hàng',
          key: 'customer_name',
          width: 24,
          merge: false,
        },
        {
          header: 'Trạng thái',
          key: 'return_status',
          width: 14,
          merge: false,
        },
        {
          header: 'Hình thức',
          key: 'return_type',
          width: 14,
          merge: false,
        },
        {
          header: 'Tổng tiền trả',
          key: 'total_return',
          width: 16,
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
      title: 'Chi tiết',
      columns: [
        { header: 'Số lượng', key: 'quantity', width: 12, merge: false },
        { header: 'Thành tiền', key: 'line_total', width: 16, merge: false },
        {
          header: 'Lý do',
          key: 'reason_status',
          width: 18,
          merge: false,
        },
        {
          header: 'Tình trạng',
          key: 'condition',
          width: 18,
          merge: false,
        },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
