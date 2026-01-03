import { ExcelTemplateConfig } from '../excel-template.types';
import { SupplierExcelSchema } from '../zod/import-suppliers.schema';

export interface SupplierDataExcel {
  code?: string | null;
  name: string;
  contact_person?: string | null;
  address?: string | null;
  tax_code?: string | null;
  email?: string | null;
  phone?: string | null;
  bank_account?: string | null;
  notes?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | null;
  total_purchased?: string | number | null;
  createdAt?: Date | string | null;
}

export const SUPPLIER_EXAMPLE_DATA: SupplierDataExcel[] = [
  {
    code: 'NCC001',
    name: 'Công ty Thực phẩm An Phát',
    contact_person: 'Nguyễn Văn A',
    address: 'Quận 1, TP.HCM',
    tax_code: '0312345678',
    email: 'contact@anphat.vn',
    phone: '0901234567',
    bank_account:
      '{"bank":"Vietcombank","account_number":"0123456789","account_name":"AN PHAT FOOD"}',
    notes: 'Chuyên cung cấp thực phẩm tươi',
    status: 'ACTIVE',
    total_purchased: '12500000',
  },
  {
    code: 'NCC002',
    name: 'Nhà cung cấp Đồ uống Minh Long',
    contact_person: 'Trần Thị B',
    address: 'Quận Bình Thạnh, TP.HCM',
    tax_code: '0309988776',
    email: 'sale@minhlong.com',
    phone: '0912345678',
    bank_account:
      '{"bank":"ACB","account_number":"9876543210","account_name":"MINH LONG"}',
    notes: 'Giao hàng nhanh trong ngày',
    status: 'ACTIVE',
    total_purchased: '7800000',
  },
  {
    code: 'NCC003',
    name: 'Cửa hàng Bao bì Thành Công',
    contact_person: 'Lê Văn C',
    address: 'Thủ Đức, TP.HCM',
    tax_code: '0311122233',
    email: 'support@thanhcong.vn',
    phone: '0987654321',
    bank_account:
      '{"bank":"Techcombank","account_number":"111122223333","account_name":"THANH CONG PACK"}',
    notes: 'Bao bì, hộp, ly giấy',
    status: 'INACTIVE',
    total_purchased: '0',
  },
];

export const SUPPLIER_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Suppliers',
  fileName: `nha_cung_cap.xlsx`,
  schema: SupplierExcelSchema,
  columns: [
    { header: 'Mã nhà cung cấp', key: 'code', width: 20 },
    { header: 'Tên nhà cung cấp*', key: 'name', width: 32 },
    { header: 'Người liên hệ', key: 'contact_person', width: 24 },
    { header: 'Địa chỉ', key: 'address', width: 32 },
    { header: 'Mã số thuế', key: 'tax_code', width: 20 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Số điện thoại', key: 'phone', width: 18 },
    { header: 'Tài khoản ngân hàng (JSON)', key: 'bank_account', width: 40 },
    { header: 'Ghi chú', key: 'notes', width: 28 },
    { header: 'Trạng thái', key: 'status', width: 14 },
    { header: 'Tổng mua', key: 'total_purchased', width: 16 },
    { header: 'Ngày tạo', key: 'createdAt', width: 18 },
  ],
  exampleData: SUPPLIER_EXAMPLE_DATA,
};
