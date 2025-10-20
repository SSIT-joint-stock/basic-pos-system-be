import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { ProductService } from './product.service';
import { BadRequestError, NotFoundError } from 'app/common/response';
import * as XLSX from 'xlsx';
import {
  ImportProductRow,
  ImportProductRowSchema,
  ImportValidationError,
} from './dto/import-product-by-excel.dto';
import { IUserWithPermissions } from 'app/common/types/permission.type';

@Injectable()
export class ImportProductService {
  private readonly errorMessages = {
    // Product Management
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_SKU_EXISTS: 'A product with this SKU already exists',
    PRODUCT_BARCODE_EXISTS: 'A product with this barcode already exists',

    // File
    FILE_NOT_FOUND: 'File not found',
    FILE_EMPTY: 'File is empty',
    FILE_TOO_LARGE: 'File size is too large, maximum allowed is 500 rows',
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
  ) {}

  async importExcelFile(
    file: Express.Multer.File,
    store_id: string,
    user: IUserWithPermissions,
  ) {
    if (!file) {
      throw new NotFoundError(this.errorMessages.FILE_NOT_FOUND);
    }

    // --- 1️⃣ Đọc file Excel ---
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      throw new BadRequestError(this.errorMessages.FILE_EMPTY);
    }
    if (jsonData.length >= 500) {
      throw new BadRequestError(this.errorMessages.FILE_TOO_LARGE);
    }

    // --- 2️⃣ Validate Zod ---
    const errors: ImportValidationError[] = [];
    const validRows: ImportProductRow[] = [];

    jsonData.forEach((row, idx) => {
      const parsed = ImportProductRowSchema.safeParse(row);
      if (!parsed.success) {
        errors.push({
          rowIndex: idx + 2, // dòng Excel (bắt đầu từ 2)
          issues: parsed.error.issues.map(
            (i) => `${i.path.join('.')}: ${i.message}`,
          ),
        });
      } else {
        validRows.push(parsed.data);
      }
    });

    // --- 3️⃣ Import vào DB ---
    const result = await this.productService.createProductsBatch(
      store_id,
      user,
      validRows,
    );

    return {
      ...result,
    };
  }
}
