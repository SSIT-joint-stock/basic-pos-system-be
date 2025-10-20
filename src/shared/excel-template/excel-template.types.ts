// app/shared/excel-template/excel-template.types.ts
export type TemplateKey = 'product' | 'category' | 'stockMovement';

export interface ExcelTemplateProvider {
  key: TemplateKey;
  sheetName(): string;
  fileName(date?: Date): string; // có thể chèn yyyy-mm-dd
  headers(): string[];
  sample(): Record<string, any>[];
}

export const EXCEL_TEMPLATE_PROVIDERS = 'EXCEL_TEMPLATE_PROVIDERS';
