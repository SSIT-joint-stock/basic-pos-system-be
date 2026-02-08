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
    const worksheet = workbook.addWorksheet(config.sheetName);

    let headerStartRow = 1;

    // --- NOTE TOP
    if (config.note?.position === 'top') {
      const noteRows = this.addNoteRow(worksheet, config, headerStartRow);
      headerStartRow += noteRows; // Không nên +3 trừ khi bạn thực sự muốn trống 3 hàng
    }

    // --- Cấu hình cột (Chỉ set Key và Width, KHÔNG set Header ở đây)
    const flatCols = config.headerGroups?.length
      ? config.headerGroups.flatMap((g) => g.columns)
      : config.columns;

    worksheet.columns = flatCols.map((c) => ({
      key: c.key,
      width: c.width ?? 20,
    }));

    // --- Tạo header thủ công tại headerStartRow
    this.createHeader(worksheet, config, headerStartRow);

    // --- Thêm dữ liệu ví dụ
    if (config.exampleData?.length) {
      worksheet.addRows(config.exampleData);

      // --- MERGE CELLS FOR EXAMPLE DATA
      const flatColumns = config.headerGroups?.length
        ? config.headerGroups.flatMap((g) => g.columns)
        : config.columns;

      const mergeColumnIndexes = flatColumns
        .map((col, index) => (col.merge ? index + 1 : null))
        .filter((idx): idx is number => idx !== null);

      if (mergeColumnIndexes.length > 0) {
        const dataStartRow =
          headerStartRow + (config.headerGroups?.length ? 2 : 1);
        this.mergeCellsByColumn(worksheet, mergeColumnIndexes, dataStartRow);
      }
    }
    // --- NOTE BOTTOM
    if (config.note?.position === 'bottom') {
      const startRow = worksheet.rowCount + 2;
      this.addNoteRow(worksheet, config, startRow);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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
      let headerStartRow = 1;
      if (config.note?.position === 'top') {
        headerStartRow += 3; // Mặc định note chiếm 3 hàng như trong addNoteRow
      }
      const startRow = headerStartRow + (config.headerGroups?.length ? 2 : 1);
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
    if (!file) {
      throw new BadRequestException(this.errMsg.DONT_HAVE_FILE);
    }

    // if (!config.schema) {
    //   throw new BadRequestException('Schema không được định nghĩa');
    // }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);

    const worksheet = workbook.getWorksheet(config.sheetName);
    if (!worksheet) {
      throw new BadRequestException(`${this.errMsg.DONT_HAVE_SHEET}`);
    }

    const validRows: T[] = [];
    const errors: Array<{ row: number; errors: Record<string, string[]> }> = [];

    // --- BƯỚC 1: XÁC ĐỊNH HÀNG HEADER VÀ HÀNG BẮT ĐẦU DỮ LIỆU ---
    let headerRowNumber = 0;
    const firstColumnHeader = config.columns[0].header;

    // Duyệt tìm hàng có chứa text của tiêu đề cột đầu tiên
    worksheet.eachRow((row, rowNumber) => {
      if (headerRowNumber > 0) return; // Đã tìm thấy thì bỏ qua các hàng sau

      const firstCellText = (row.getCell(1).text ?? '').trim();
      if (firstCellText === firstColumnHeader) {
        headerRowNumber = rowNumber;
      }
    });

    // Nếu không tìm thấy header, có thể file sai mẫu
    if (headerRowNumber === 0) {
      throw new BadRequestException(
        'Cấu trúc file không đúng mẫu hoặc thiếu tiêu đề cột.',
      );
    }

    // Dữ liệu thực tế bắt đầu từ hàng sau Header
    const dataStartRow = headerRowNumber + 1;

    // --- BƯỚC 2: CHỈ ĐỌC DỮ LIỆU TỪ HÀNG dataStartRow ---
    worksheet.eachRow((row, rowNumber) => {
      // Bỏ qua mọi hàng trước và bao gồm cả hàng Header
      if (rowNumber < dataStartRow) return;

      try {
        // Kiểm tra dòng trống
        const isEmptyRow = config.columns.every((_, idx) => {
          const cellText = (row.getCell(idx + 1).text ?? '').trim();
          return cellText === '';
        });

        if (isEmptyRow) return;

        const rawData = config.columns.reduce(
          (acc, col, idx) => {
            let v = (row.getCell(idx + 1).text ?? '').trim();

            // Xử lý dấu ngoặc kép dư thừa nếu có
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
  ): ExcelJS.Worksheet {
    const worksheet = workbook.addWorksheet(config.sheetName);

    let headerStartRow = 1;
    if (config.note?.position === 'top') {
      const noteRows = this.addNoteRow(worksheet, config, headerStartRow);
      headerStartRow += noteRows; // Ví dụ: note chiếm 3 hàng, headerStartRow sẽ là 4
    }

    // --- THAY ĐỔI Ở ĐÂY: Không gán worksheet.columns trực tiếp ---
    const flatColumns = config.headerGroups?.length
      ? config.headerGroups.flatMap((g) => g.columns)
      : config.columns;

    // Thiết lập độ rộng cột (vẫn cần thiết nhưng không gán header ở đây)
    worksheet.columns = flatColumns.map((c) => ({
      key: c.key,
      width: c.width ?? 20,
    }));

    if (config.headerGroups?.length) {
      // HEADER 2 TẦNG (Logic giữ nguyên nhưng đảm bảo dùng headerStartRow)
      let colIndex = 1;
      config.headerGroups.forEach((group) => {
        const startCol = colIndex;
        const endCol = colIndex + group.columns.length - 1;

        worksheet.mergeCells(headerStartRow, startCol, headerStartRow, endCol);
        const groupCell = worksheet.getCell(headerStartRow, startCol);
        groupCell.value = group.title;
        this.styleGroupHeader(groupCell);

        group.columns.forEach((col) => {
          const headerCell = worksheet.getCell(headerStartRow + 1, colIndex);
          headerCell.value = col.header;
          this.styleSubHeader(headerCell);
          colIndex++;
        });
      });
      worksheet.getRow(headerStartRow).height = 32;
      worksheet.getRow(headerStartRow + 1).height = 28;
      worksheet.views = [{ state: 'frozen', ySplit: headerStartRow + 1 }];
    } else {
      // HEADER 1 TẦNG
      config.columns.forEach((col, index) => {
        const cell = worksheet.getCell(headerStartRow, index + 1);
        cell.value = col.header;
        this.styleGroupHeader(cell);
      });
      worksheet.getRow(headerStartRow).height = 30;
      worksheet.views = [{ state: 'frozen', ySplit: headerStartRow }];
    }
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
      });
    });

    // ... (phần style và wrap text giữ nguyên)
    return worksheet;
  }

  private createHeader(
    worksheet: ExcelJS.Worksheet,
    config: ExcelTemplateConfig,
    startRow: number,
  ) {
    if (config.headerGroups?.length) {
      let colIndex = 1;
      config.headerGroups.forEach((group) => {
        const endCol = colIndex + group.columns.length - 1;
        worksheet.mergeCells(startRow, colIndex, startRow, endCol);
        const groupCell = worksheet.getCell(startRow, colIndex);
        groupCell.value = group.title;
        this.styleGroupHeader(groupCell);

        group.columns.forEach((col) => {
          const headerCell = worksheet.getCell(startRow + 1, colIndex);
          headerCell.value = col.header;
          this.styleSubHeader(headerCell);
          colIndex++;
        });
      });
      worksheet.getRow(startRow).height = 32;
      worksheet.getRow(startRow + 1).height = 28;
      worksheet.views = [{ state: 'frozen', ySplit: startRow + 1 }];
    } else {
      // Header 1 tầng: Gán giá trị trực tiếp từng ô thay vì dùng worksheet.columns
      config.columns.forEach((col, index) => {
        const cell = worksheet.getCell(startRow, index + 1);
        cell.value = col.header;
        this.styleGroupHeader(cell);
      });
      worksheet.getRow(startRow).height = 30;
      worksheet.views = [{ state: 'frozen', ySplit: startRow }];
    }
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

  private addNoteRow(
    worksheet: ExcelJS.Worksheet,
    config: ExcelTemplateConfig,
    startRow: number,
  ) {
    if (!config.note) return 0;

    // Lấy tổng số cột thực tế
    const totalCols = config.headerGroups?.length
      ? config.headerGroups.flatMap((g) => g.columns).length
      : config.columns.length;

    const rowSpan = 3;
    // Merge từ hàng startRow đến startRow + rowSpan - 1
    worksheet.mergeCells(startRow, 1, startRow + rowSpan - 1, totalCols);

    const cell = worksheet.getCell(startRow, 1);
    cell.value = config.note.text;
    cell.value = config.note.text;

    cell.alignment = {
      wrapText: true,
      vertical: 'top',
      horizontal: 'left',
    };

    cell.font = { italic: true, size: 11 };

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: config.note.backgroundColor ?? 'FFF5F5F5' },
    };

    worksheet.getRow(startRow).height = config.note.height ?? 60;

    // ... (style giữ nguyên)

    return rowSpan;
  }
}
