/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConflictError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { SUPPLIER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/supplier';
import { Supplier } from '@prisma/client';
import { GenerateCodeSupplier } from './use-case/generate-supplier-code.usecase';

@Injectable()
export class ImportSupplierService {
  private errMsg = {
    DUPLICATE_CODE: 'Mã nhà cung cấp đã tồn tại',
  };
  constructor(
    private readonly excelService: ExcelTemplateService,
    private readonly prisma: PrismaService,
    private readonly codeUseCase: GenerateCodeSupplier,
  ) {}
  async downloadExampleCategory() {
    return this.excelService.generateTemplateExample(SUPPLIER_EXCEL_TEMPLATE);
  }
  async getSupplierExcel(storeId: string) {
    await this.checkStore(storeId);
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        store_id: storeId,
      },
    });
    const data = suppliers.map((c) => ({
      code: c.code ?? '',
      name: c.name,
      contact_person: c.contact_person ?? '',
      address: c.address ?? '',
      tax_code: c.tax_code ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      bank_account: c.bank_account ?? '',
      notes: c.notes ?? '',
      status: c.status,
      total_purchased: c.total_purchased ?? 0,
      createdAt: c.createdAt,
    }));
    return this.excelService.exportData(SUPPLIER_EXCEL_TEMPLATE, data);
  }
  async importSupplierExcel(storeId: string, file: Express.Multer.File) {
    await this.checkStore(storeId);

    // dữ liệu đã qua zod (nhưng excel service đang stringify hết cell -> chủ yếu vẫn là string)
    const data = await this.excelService.importData<any>(
      SUPPLIER_EXCEL_TEMPLATE,
      file,
    );

    // ===== helpers =====
    const findDup = <T>(arr: T[]) => {
      const m = new Map<T, number>();
      for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
      return [...m.entries()].filter(([, n]) => n > 1).map(([x]) => x);
    };

    // normalize để tránh abc vs ABC, email hoa/thường
    const normCode = (v: any) =>
      String(v ?? '')
        .trim()
        .toUpperCase();

    const normEmail = (v: any) => {
      const s = String(v ?? '')
        .trim()
        .toLowerCase();
      return s.length ? s : null;
    };

    // optional string: "" => null
    const normOptionalText = (v: any) => {
      const s = String(v ?? '').trim();
      return s.length ? s : null;
    };

    // ===== 1) normalize rows =====
    const rows = data.map((r: any) => ({
      ...r,
      code: normCode(r.code), // "" nếu trống
      email: normEmail(r.email), // null nếu trống
      name: String(r.name ?? '').trim(),

      contact_person: normOptionalText(r.contact_person),
      address: normOptionalText(r.address),
      tax_code: normOptionalText(r.tax_code),
      phone: normOptionalText(r.phone),
      notes: normOptionalText(r.notes),

      // giữ nguyên bank_account (zod có thể parse JSON rồi)
      bank_account: r.bank_account ?? null,

      status: normOptionalText(r.status) ?? 'ACTIVE',
    }));

    // ===== 2) check trùng trong file (chỉ check những cái user nhập) =====
    const inputCodes = rows.map((r) => r.code).filter(Boolean);
    const inputEmails = rows.map((r) => r.email).filter(Boolean) as string[];

    const dupCodesInFile = findDup(inputCodes);
    const dupEmailsInFile = findDup(inputEmails);

    // ===== 3) check trùng với DB (chỉ check những cái user nhập) =====
    const uniqCodes = [...new Set(inputCodes)];
    const uniqEmails = [...new Set(inputEmails)];

    const existing = await this.prisma.supplier.findMany({
      where: {
        store_id: storeId,
        OR: [
          ...(uniqCodes.length ? [{ code: { in: uniqCodes } }] : []),
          ...(uniqEmails.length ? [{ email: { in: uniqEmails } }] : []),
        ],
      },
      select: { code: true, email: true },
    });

    const existingCodeSet = new Set(existing.map((x) => normCode(x.code)));
    const existingEmailSet = new Set(
      existing.map((x) => normEmail(x.email)).filter(Boolean) as string[],
    );

    const dupCodesInDb = uniqCodes.filter((c) => existingCodeSet.has(c));
    const dupEmailsInDb = uniqEmails.filter((e) => existingEmailSet.has(e));

    // ===== 4) trả lỗi gọn =====
    const errors: string[] = [];
    if (dupCodesInFile.length)
      errors.push(`Code trùng trong file: ${dupCodesInFile.join(', ')}`);
    if (dupEmailsInFile.length)
      errors.push(`Email trùng trong file: ${dupEmailsInFile.join(', ')}`);
    if (dupCodesInDb.length)
      errors.push(`Code đã tồn tại: ${dupCodesInDb.join(', ')}`);
    if (dupEmailsInDb.length)
      errors.push(`Email đã tồn tại: ${dupEmailsInDb.join(', ')}`);

    if (errors.length) throw new ConflictError(errors.join(' | '));

    // ===== 5) generate code cho các dòng thiếu code (QUAN TRỌNG) =====
    const missingIndexes = rows
      .map((r, i) => (!r.code ? i : -1))
      .filter((i) => i !== -1);

    if (missingIndexes.length) {
      // Lấy last code hiện có trong DB theo prefix/pad của usecase
      const prefix = 'NCC';
      const padLength = 5;

      const last = await this.prisma.supplier.findFirst({
        where: { store_id: storeId, code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
        select: { code: true },
      });

      let nextNumber = last?.code
        ? parseInt(last.code.slice(prefix.length), 10) + 1
        : 1;

      // reserved: code đã có trong file (user nhập) để tránh đụng ngay trong file
      const reserved = new Set(rows.map((r) => r.code).filter(Boolean));

      const generated: string[] = [];
      while (generated.length < missingIndexes.length) {
        const c = `${prefix}${String(nextNumber).padStart(padLength, '0')}`;
        nextNumber++;

        // tránh trùng với code user nhập trong file
        if (reserved.has(c)) continue;

        reserved.add(c);
        generated.push(c);
      }

      // gán code đã generate vào rows
      missingIndexes.forEach((rowIdx, j) => {
        rows[rowIdx].code = generated[j];
      });
    }

    // ===== 6) insert =====
    const suppliersToCreate = rows.map((r: any) => ({
      store_id: storeId,
      code: r.code, // chắc chắn đã có
      name: r.name,
      contact_person: r.contact_person ?? '',
      address: r.address ?? '',
      tax_code: r.tax_code ?? '',
      email: r.email ?? '',
      phone: r.phone ?? '',
      bank_account: r.bank_account ?? '',
      notes: r.notes ?? '',
      status: r.status ?? 'ACTIVE',
    }));

    return this.prisma.supplier.createMany({
      data: suppliersToCreate,
    });
  }

  private async checkStore(storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }
}
