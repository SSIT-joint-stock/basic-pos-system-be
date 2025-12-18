import { ZodSchema } from 'zod';

// hỗ trợ cho việc file excel đó chỉ có các 1 cột đơn lẻ vd: Tên | thông tin | ngày tạo
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}
// hỗ trỡ cho việc file excel đó có các cột lớn trong các cột lớn đó có nhiều cột nhỏ vd: trong cột lớn Đơn hàng có các cột nhỏ khác như Tên | số đơn hàng | ngày tạo ...
export interface ExcelHeaderGroup {
  title: string;
  columns: ExcelColumn[];
}
export interface ExcelTemplateConfig {
  sheetName: string;
  fileName: string;
  schema?: ZodSchema;
  headerGroups?: ExcelHeaderGroup[];
  columns: ExcelColumn[];
  exampleData?: Record<string, any>[];
}
