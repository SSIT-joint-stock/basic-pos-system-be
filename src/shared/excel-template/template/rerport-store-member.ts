import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';

export interface ReportStoreMemberExcel {
  member_name: string;
  member_email: string;
  total_orders: string;
  total_order_success: string;
  total_order_price: string;
  total_price_amount: string;
  created_at: string;
}
export const REPORT_STORE_MEMBER_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Báo cáo NV',
  fileName: 'bao_cao_NV.xlsx',
  headerGroups: [
    {
      title: 'Nhân viên',
      columns: [
        {
          header: 'Tên nhân viên',
          key: 'member_name',
          width: 30,
          merge: true,
        },
        {
          header: 'Email',
          key: 'member_email',
          width: 30,
          merge: true,
        },
      ],
    },
    {
      title: 'Doanh số',
      columns: [
        {
          header: 'Tổng đơn hàng',
          key: 'total_orders',
          width: 22,
          merge: false,
        },
        {
          header: 'Tổng đơn hoàn thành',
          key: 'total_order_success',
          width: 22,
          merge: false,
        },
        {
          header: 'Tổng thu đơn hàng',
          key: 'total_price_amount',
          width: 22,
          merge: false,
        },
        {
          header: 'Tổng doanh số',
          key: 'total_order_price',
          width: 22,
          merge: false,
        },
      ],
    },
  ],
  columns: [],
  exampleData: [],
};
