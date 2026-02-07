import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportSalesExcel {
  stt: number;
  order_date: string;
  order_code: string;
  customer_name: string;
  total_amount: string;
  discount_amount: string;
  tax_amount: string;
  final_amount: string;
  payment_method: string;
  status: string;
}

export const REPORT_SALES_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Báo cáo bán hàng',
  fileName: 'bao_cao_ban_hang.xlsx',
  headerGroups: [
    {
      title: 'Thông tin đơn hàng',
      columns: [
        { header: 'STT', key: 'stt', width: 8, merge: false },
        { header: 'Thời gian', key: 'order_date', width: 22, merge: false },
        { header: 'Mã hóa đơn', key: 'order_code', width: 18, merge: false },
        {
          header: 'Khách hàng',
          key: 'customer_name',
          width: 25,
          merge: false,
        },
      ],
    },
    {
      title: 'Chi tiết thanh toán',
      columns: [
        {
          header: 'Tổng tiền hàng',
          key: 'total_amount',
          width: 18,
          merge: false,
        },
        {
          header: 'Chiết khấu',
          key: 'discount_amount',
          width: 15,
          merge: false,
        },
        {
          header: 'Thuế',
          key: 'tax_amount',
          width: 12,
          merge: false,
        },
        {
          header: 'Thành tiền',
          key: 'final_amount',
          width: 18,
          merge: false,
        },
      ],
    },
    {
      title: 'Trạng thái',
      columns: [
        {
          header: 'Phương thức thanh toán',
          key: 'payment_method',
          width: 22,
          merge: false,
        },
        {
          header: 'Trạng thái đơn hàng',
          key: 'status',
          width: 20,
          merge: false,
        },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
