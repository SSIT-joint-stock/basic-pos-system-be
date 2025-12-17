import * as ExcelJS from 'exceljs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ExcelTemplateConfig } from './excel-template.types';
import { CategoryDataExcel } from './template/category';

@Injectable()
export class ExcelTemplateService {
  private errMsg = {
    DONT_HAVE_FILE: 'Không tìm thấy file upload. Vui lòng thử lại!',
    DONT_HAVE_SHEET: 'Không tìm thấy sheet. Vui lòng thử lại!',
    DATA_NOT_VALID:
      'File Excel có dữ liệu không hợp lệ. Vui lòng nhập đúng dữ liệu với mẫu Excel!',
  };
  /**
   * Tạo mẫu Excel từ cấu hình ExcelTemplateConfig
   * @param config Cấu hình ExcelTemplateConfig
   * @returns Promise<Buffer> Mẫu Excel dưới dạng Buffer
   */
  async generateTemplateExample(config: ExcelTemplateConfig): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = this.createWorksheet(workbook, config);
    // add example data vao file excel
    if (config.exampleData?.length) {
      worksheet.addRows(config.exampleData);
    }
    // sau do ghi moi buffer
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
  /**
   * Xuất dữ liệu vào file Excel
   * @param config Cấu hình ExcelTemplateConfig
   * @param data Mảng dữ liệu cần xuất
   * @returns Promise<Buffer> File Excel đã được xuất
   */

  async exportData(config: ExcelTemplateConfig, data: CategoryDataExcel[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = this.createWorksheet(workbook, config);
    worksheet.addRows(data);
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Nhập dữ liệu từ file Excel vào cấu hình ExcelTemplateConfig
   * @param config Cấu hình ExcelTemplateConfig
   * @param file File upload
   * @returns Promise<T[]> Mảng dữ liệu đã được nhập
   */
  async importData<T>(
    config: ExcelTemplateConfig,
    file: Express.Multer.File,
  ): Promise<T[]> {
    // Kiểm tra xem có file upload hay không
    if (!file) {
      throw new BadRequestException(this.errMsg.DONT_HAVE_FILE);
    }

    // Kiểm tra xem có schema hay không
    if (!config.schema) {
      throw new BadRequestException('Schema không được định nghĩa');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);

    const worksheet = workbook.getWorksheet(config.sheetName);
    if (!worksheet) {
      throw new BadRequestException(`${this.errMsg.DONT_HAVE_SHEET}`);
    }

    const validRows: T[] = [];
    const errors: Array<{ row: number; errors: Record<string, string[]> }> = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua header
      if (rowNumber === 1) return; // skip header

      try {
        // Bỏ qua các dòng trống
        // Skip empty rows
        const isEmptyRow = config.columns.every((col, idx) => {
          const cellValue = row.getCell(idx + 1).value;
          return !cellValue || String(cellValue).trim() === '';
        });

        if (isEmptyRow) {
          return;
        }

        const rawData = config.columns.reduce(
          (acc, col, idx) => {
            const cellValue = row.getCell(idx + 1).value;
            acc[col.key] = cellValue ? String(cellValue).trim() : '';
            return acc;
          },
          {} as Record<string, any>,
        );

        const parsed = config.schema!.safeParse(rawData);

        if (!parsed.success) {
          errors.push({
            row: rowNumber,
            errors: parsed.error.flatten().fieldErrors as Record<
              string,
              string[]
            >,
          });
        } else {
          validRows.push(parsed.data as T);
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          errors: {
            _error: [error instanceof Error ? error.message : 'Lỗi xử lý dòng'],
          },
        });
      }
    });

    if (errors.length) {
      throw new BadRequestException({
        message: `${this.errMsg.DATA_NOT_VALID}`,
        errors: errors.slice(0, 10),
        validCount: validRows.length,
        totalErrors: errors.length,
      });
    }

    return validRows;
  }

  /**
   * Tạo worksheet từ cấu hình ExcelTemplateConfig
   * @param workbook Workbook ExcelJS
   * @param config Cấu hình ExcelTemplateConfig
   * @returns Worksheet được tạo
   */
  private createWorksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelTemplateConfig,
  ) {
    const worksheet = workbook.addWorksheet(config.sheetName);

    // Set columns
    worksheet.columns = config.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 20,
    }));

    // Freeze header
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Header style
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
    });

    return worksheet;
  }
}
