import { ZodSchema } from 'zod';
export interface ExcelTemplateNoteConfig {
  text: string;
  height?: number;
  position?: 'top' | 'bottom';
  backgroundColor?: string; // argb, vd: 'FFF2F2F2'
}

// hỗ trợ cho việc file excel đó chỉ có các 1 cột đơn lẻ vd: Tên | thông tin | ngày tạo
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  merge?: boolean; // true: merge theo key, false: khong merge
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
  note?: ExcelTemplateNoteConfig; // 👈 CUSTOM NOTE
}
