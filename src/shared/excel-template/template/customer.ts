import { ExcelTemplateConfig } from '../excel-template.types';
import { CustomerExcelSchema } from '../zod/import-customers.schema';

export interface CustomerDataExcel {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  createdAt?: Date | string | null;
}

export const CUSTOMER_EXAMPLE_DATA: CustomerDataExcel[] = [
  {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'a.nguyen@gmail.com',
    address: '12 Nguyễn Huệ, Quận 1',
    city: 'TP.HCM',
    state: 'Hồ Chí Minh',
    zip: '700000',
    country: 'VN',
  },
  {
    name: 'Trần Thị B',
    phone: '0912345678',
    email: 'tranb@gmail.com',
    address: '45 Lê Lợi, Quận 1',
    city: 'TP.HCM',
    state: 'Hồ Chí Minh',
    zip: '700000',
    country: 'VN',
  },
  {
    name: 'Lê Văn C',
    phone: '0987654321',
    email: 'levanc@outlook.com',
    address: '20 Phan Xích Long, Phú Nhuận',
    city: 'TP.HCM',
    state: 'Hồ Chí Minh',
    zip: '700000',
    country: 'VN',
  },
  {
    name: 'Phạm Minh D',
    phone: '0933333333',
    email: 'minhd@yahoo.com',
    address: '88 Võ Văn Tần, Quận 3',
    city: 'TP.HCM',
    state: 'Hồ Chí Minh',
    zip: '700000',
    country: 'VN',
  },
  {
    name: 'Khách lẻ',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  },
];

export const CUSTOMER_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Customers',
  fileName: `khach_hang.xlsx`,
  schema: CustomerExcelSchema,
  columns: [
    { header: 'Tên khách hàng*', key: 'name', width: 28 },
    { header: 'Số điện thoại', key: 'phone', width: 18 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Địa chỉ', key: 'address', width: 32 },
    { header: 'Thành phố', key: 'city', width: 18 },
    { header: 'Tỉnh/Bang', key: 'state', width: 18 },
    { header: 'Mã bưu chính', key: 'zip', width: 14 },
    { header: 'Quốc gia', key: 'country', width: 12 },
    { header: 'Ngày tạo', key: 'createdAt', width: 18 },
  ],
  exampleData: CUSTOMER_EXAMPLE_DATA as any,
};
