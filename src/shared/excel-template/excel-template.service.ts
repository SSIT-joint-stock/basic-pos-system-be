import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ExcelTemplateConfig } from './excel-template.types';

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

  async exportData(config: ExcelTemplateConfig, data: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = this.createWorksheet(workbook, config);
    worksheet.addRows(data);

    let mergeColumnIndexes: number[] = [];

    if (config.headerGroups?.length) {
      const allColumns = config.headerGroups.flatMap((g) => g.columns);
      mergeColumnIndexes = allColumns
        .map((col, index) => (col.merge ? index + 1 : null))
        .filter((idx): idx is number => idx !== null);
    } else {
      mergeColumnIndexes = config.columns
        .map((col, index) => (col.merge ? index + 1 : null))
        .filter((idx): idx is number => idx !== null);
    }

    if (mergeColumnIndexes.length > 0) {
      const startRow = config.headerGroups?.length ? 3 : 2;
      this.mergeCellsByColumn(worksheet, mergeColumnIndexes, startRow);
    }

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
          const cellText = (row.getCell(idx + 1).text ?? '').trim();
          return cellText === '';
        });

        if (isEmptyRow) {
          return;
        }

        const rawData = config.columns.reduce(
          (acc, col, idx) => {
            let v = (row.getCell(idx + 1).text ?? '').trim(); // ⭐ dùng text

            // ⭐ FIX: nếu bị dạng `"0"` / `"abc"` thì bỏ dấu ngoặc kép
            if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
              v = v.slice(1, -1).trim();
            }

            acc[col.key] = v;
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

    // HEADER 2 TẦNG
    if (config.headerGroups?.length) {
      const flatColumns = config.headerGroups.flatMap((g) => g.columns);

      // Set columns 1 LẦN DUY NHẤT (key + width)
      worksheet.columns = flatColumns.map((c) => ({
        key: c.key,
        width: c.width ?? 48,
      }));

      let colIndex = 1;

      // Row 1: header lớn | Row 2: header con
      config.headerGroups.forEach((group) => {
        const startCol = colIndex;
        const endCol = colIndex + group.columns.length - 1;

        worksheet.mergeCells(1, startCol, 1, endCol);
        const groupCell = worksheet.getCell(1, startCol);
        groupCell.value = group.title;
        this.styleGroupHeader(groupCell);

        group.columns.forEach((col) => {
          const headerCell = worksheet.getCell(2, colIndex);
          headerCell.value = col.header;
          this.styleSubHeader(headerCell);
          colIndex++;
        });
      });

      // Height + freeze
      worksheet.getRow(1).height = 32;
      worksheet.getRow(2).height = 28;
      worksheet.views = [{ state: 'frozen', ySplit: 2 }];

      // Wrap text toàn sheet
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true,
          };
        });
      });

      return worksheet;
    }

    //FALLBACK HEADER 1 TẦNG
    worksheet.columns = config.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 48,
    }));

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.getRow(1).eachCell((cell) => this.styleGroupHeader(cell));

    return worksheet;
  }

  private mergeCellsByColumn(
    worksheet: ExcelJS.Worksheet,
    columnIndexes: number[],
    startRow = 3,
  ) {
    let currentValue = worksheet.getCell(startRow, columnIndexes[0]).value;
    let groupStartRow = startRow;

    for (let row = startRow + 1; row <= worksheet.rowCount + 1; row++) {
      const cellValue =
        row <= worksheet.rowCount
          ? worksheet.getCell(row, columnIndexes[0]).value
          : null;

      if (cellValue !== currentValue) {
        const groupEndRow = row - 1;

        if (groupEndRow > groupStartRow && currentValue) {
          columnIndexes.forEach((colIndex) => {
            worksheet.mergeCells(
              groupStartRow,
              colIndex,
              groupEndRow,
              colIndex,
            );
          });
        }

        groupStartRow = row;
        currentValue = cellValue;
      }
    }
  }

  private styleGroupHeader(cell: ExcelJS.Cell) {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }, // xanh
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  }

  private styleSubHeader(cell: ExcelJS.Cell) {
    cell.font = { bold: true, color: { argb: 'FF000000' }, size: 11 };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' }, // trắng
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  }
}
