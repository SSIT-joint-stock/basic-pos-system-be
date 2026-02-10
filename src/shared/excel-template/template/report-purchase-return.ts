import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportPurchaseReturnExcel {
  stt: number;
  return_date: string;
  return_number: string;
  supplier_name: string;
  supplier_code: string;
  status: string;
  payment_status: string;
  total_return: string;
  variant_name: string;
  product_name: string;
  base_unit: string;
  quantity: number;
  unit_cost: string;
  line_total: string;
  reason: string;
}

export const REPORT_PURCHASE_RETURN_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Trả NCC',
  fileName: 'bao_cao_tra_ncc.xlsx',
  headerGroups: [
    {
      title: 'Phiếu trả NCC',
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
          header: 'Nhà cung cấp',
          key: 'supplier_name',
          width: 24,
          merge: false,
        },
        {
          header: 'Mã NCC',
          key: 'supplier_code',
          width: 16,
          merge: false,
        },
        { header: 'Trạng thái', key: 'status', width: 14, merge: false },
        {
          header: 'Thanh toán',
          key: 'payment_status',
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
        { header: 'Đơn giá', key: 'unit_cost', width: 16, merge: false },
        { header: 'Thành tiền', key: 'line_total', width: 16, merge: false },
        { header: 'Lý do', key: 'reason', width: 24, merge: false },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
