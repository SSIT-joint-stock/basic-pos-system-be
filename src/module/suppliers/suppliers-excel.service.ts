/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { SUPPLIER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/supplier';
import { ImportHelper } from 'app/shared/utils/import-helper.util';
import { ImportValidationService } from 'app/shared/import-excel/import-validation.service';
import { BaseImportService } from 'app/shared/import-excel/base-import.service';
import { Prisma, supplier_status } from '@prisma/client';
import { GenerateCodeSupplier } from './use-case/generate-supplier-code.usecase';

type SupplierRow = {
  code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  tax_code: string | null;
  bank_account: Prisma.InputJsonValue | null;
  notes: string | null;
  status: supplier_status | 'ACTIVE';
};

@Injectable()
export class ImportSupplierService extends BaseImportService<SupplierRow, any> {
  protected template = SUPPLIER_EXCEL_TEMPLATE;
  protected prismaDelegateKey: keyof PrismaService = 'supplier';

  protected uniqueRules = [
    {
      field: 'code',
      label: 'Code',
      normalize: (v) => ImportHelper.normalizeCode(v),
    },
    {
      field: 'email',
      label: 'Email',
      normalize: (v) => ImportHelper.normalizeEmail(v),
    },
  ] as const;

  constructor(
    excelService: ExcelTemplateService,
    prisma: PrismaService,
    validator: ImportValidationService,
    private readonly codeUseCase: GenerateCodeSupplier,
  ) {
    super(excelService, prisma, validator);
  }

  // ✅ controller gọi 3 hàm này cho gọn
  downloadExampleSupplier() {
    return this.downloadExample();
  }

  exportSupplierExcel(storeId: string) {
    return this.exportExcel(storeId, (s: any) => ({
      code: s.code ?? '',
      name: s.name,
      contact_person: s.contact_person ?? '',
      address: s.address ?? '',
      tax_code: s.tax_code ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      bank_account: s.bank_account ?? '',
      notes: s.notes ?? '',
      status: s.status,
      total_purchased: s.total_purchased ?? 0,
      createdAt: s.createdAt,
    }));
  }

  importSupplierExcel(storeId: string, file: Express.Multer.File) {
    return this.importExcel(storeId, file);
  }

  protected normalizeRow(r: any): SupplierRow {
    return {
      code: ImportHelper.normalizeCode(r.code),
      name: ImportHelper.normalizeText(r.name) ?? '',
      email: ImportHelper.normalizeEmail(r.email),
      phone: ImportHelper.normalizeText(r.phone),
      contact_person: ImportHelper.normalizeText(r.contact_person),
      address: ImportHelper.normalizeText(r.address),
      tax_code: ImportHelper.normalizeText(r.tax_code),
      bank_account: r.bank_account ?? null,
      notes: ImportHelper.normalizeText(r.notes),
      status: ImportHelper.parseEnum(
        r.status,
        supplier_status,
        supplier_status.ACTIVE,
      ),
    };
  }

  protected override async preprocessRows(
    storeId: string,
    rows: SupplierRow[],
  ): Promise<SupplierRow[]> {
    const missingIndexes = rows
      .map((r, i) => (!r.code ? i : -1))
      .filter((i) => i !== -1);

    if (!missingIndexes.length) return rows;

    // code user đã nhập trong file (sau normalize) để tránh generate trùng ngay trong file
    const reserved = new Set(
      rows.map((r) => r.code).filter(Boolean) as string[],
    );

    // generate batch
    const generated = await this.codeUseCase.generateCodeBatch(
      storeId,
      missingIndexes.length,
    );

    // gán code, nếu đụng reserved thì generate thêm cho đến khi đủ
    const assign: string[] = [];
    let cursor = 0;

    while (assign.length < missingIndexes.length) {
      // nếu dùng hết codes mà vẫn chưa đủ (do bị trùng reserved) -> generate thêm 1 batch
      if (cursor >= generated.length) {
        const more = await this.codeUseCase.generateCodeBatch(
          storeId,
          missingIndexes.length, // generate thêm 1 lô cho chắc
        );
        generated.push(...more);
      }

      const c = generated[cursor++];
      if (!c || reserved.has(c)) continue;

      reserved.add(c);
      assign.push(c);
    }

    missingIndexes.forEach((rowIdx, j) => {
      rows[rowIdx].code = assign[j];
    });

    return rows;
  }

  protected toCreate(row: SupplierRow, storeId: string) {
    return {
      store_id: storeId,
      code: row.code ?? '',
      name: row.name,
      contact_person: row.contact_person ?? '',
      address: row.address ?? '',
      tax_code: row.tax_code ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      bank_account: row.bank_account ?? '',
      notes: row.notes ?? '',
      status: row.status ?? 'ACTIVE',
    };
  }
}
