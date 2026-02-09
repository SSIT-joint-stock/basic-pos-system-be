import { ExcelTemplateConfig } from '../excel-template.types';

export interface StoreMemberDataExcel {
  email: string;
  username?: string | null;
  role: 'OWNER' | 'MEMBER';
  createdAt?: Date | null;
}

export const STORE_MEMBER_EXAMPLE_DATA: StoreMemberDataExcel[] = [
  {
    email: 'owner@store.com',
    username: 'store_owner',
    role: 'OWNER',
  },
  {
    email: 'staff1@store.com',
    username: 'staff_01',
    role: 'MEMBER',
  },
  {
    email: 'staff2@store.com',
    username: 'staff_02',
    role: 'MEMBER',
  },
  {
    email: 'staff3@store.com',
    username: 'staff_03',
    role: 'MEMBER',
  },
  {
    email: 'staff4@store.com',
    username: 'staff_04',
    role: 'MEMBER',
  },
];

export const STORE_MEMBER_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Store Members',
  fileName: 'thanh_vien_cua_hang.xlsx',
  columns: [
    { header: 'Email*', key: 'email', width: 40 },
    { header: 'Tên đăng nhập', key: 'username', width: 30 },
    { header: 'Vai trò*', key: 'role', width: 25 },
    { header: 'Ngày tham gia', key: 'createdAt', width: 30 },
  ],
  exampleData: STORE_MEMBER_EXAMPLE_DATA,
};
