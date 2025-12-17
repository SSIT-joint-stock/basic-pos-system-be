import { ZodSchema } from 'zod';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}
export interface ExcelTemplateConfig {
  sheetName: string;
  fileName: string;
  columns: ExcelColumn[];
  exampleData?: Record<string, any>[];
  schema?: ZodSchema;
}
