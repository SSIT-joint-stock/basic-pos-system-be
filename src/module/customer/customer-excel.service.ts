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
import { CUSTOMER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/customer';

@Injectable()
export class ImportCustomerService {
  constructor(
    private readonly excelService: ExcelTemplateService,
    private readonly prisma: PrismaService,
  ) {}

  async downloadExampleCustomer() {
    return this.excelService.generateTemplateExample(CUSTOMER_EXCEL_TEMPLATE);
  }

  async getCustomerExcel(storeId: string) {
    await this.checkStore(storeId);

    const customers = await this.prisma.customer.findMany({
      where: { store_id: storeId },
    });

    const data = customers.map((c) => ({
      name: c.name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      city: c.city ?? '',
      state: c.state ?? '',
      zip: c.zip ?? '',
      country: c.country ?? '',
      createdAt: c.createdAt,
    }));

    return this.excelService.exportData(CUSTOMER_EXCEL_TEMPLATE, data);
  }

  async importCustomerExcel(storeId: string, file: Express.Multer.File) {
    await this.checkStore(storeId);

    const data = await this.excelService.importData<any>(
      CUSTOMER_EXCEL_TEMPLATE,
      file,
    );

    // ===== helpers =====
    const findDup = <T>(arr: T[]) => {
      const m = new Map<T, number>();
      for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
      return [...m.entries()].filter(([, n]) => n > 1).map(([x]) => x);
    };

    const normOptionalText = (v: any) => {
      const s = String(v ?? '').trim();
      return s.length ? s : null;
    };

    const normEmail = (v: any) => {
      const s = String(v ?? '')
        .trim()
        .toLowerCase();
      return s.length ? s : null;
    };

    // phone: bỏ space, dấu chấm, dấu gạch (tuỳ bạn)
    const normPhone = (v: any) => {
      const s = String(v ?? '')
        .trim()
        .replace(/\s+/g, '')
        .replace(/[-.]/g, '');
      return s.length ? s : null;
    };

    // ===== 1) normalize rows =====
    const rows = data.map((r: any) => ({
      ...r,
      name: String(r.name ?? '').trim(),
      phone: normPhone(r.phone),
      email: normEmail(r.email),
      address: normOptionalText(r.address),
      city: normOptionalText(r.city),
      state: normOptionalText(r.state),
      zip: normOptionalText(r.zip),
      country: normOptionalText(r.country),
    }));

    // ===== 2) check trùng trong file =====
    const inputEmails = rows.map((r) => r.email).filter(Boolean) as string[];
    const inputPhones = rows.map((r) => r.phone).filter(Boolean) as string[];

    const dupEmailsInFile = findDup(inputEmails);
    const dupPhonesInFile = findDup(inputPhones);

    // ===== 3) check trùng với DB =====
    const uniqEmails = [...new Set(inputEmails)];
    const uniqPhones = [...new Set(inputPhones)];

    const existing = await this.prisma.customer.findMany({
      where: {
        store_id: storeId,
        OR: [
          ...(uniqEmails.length ? [{ email: { in: uniqEmails } }] : []),
          ...(uniqPhones.length ? [{ phone: { in: uniqPhones } }] : []),
        ],
      },
      select: { email: true, phone: true },
    });

    const existingEmailSet = new Set(
      existing.map((x) => normEmail(x.email)).filter(Boolean) as string[],
    );
    const existingPhoneSet = new Set(
      existing.map((x) => normPhone(x.phone)).filter(Boolean) as string[],
    );

    const dupEmailsInDb = uniqEmails.filter((e) => existingEmailSet.has(e));
    const dupPhonesInDb = uniqPhones.filter((p) => existingPhoneSet.has(p));

    // ===== 4) trả lỗi gọn =====
    const errors: string[] = [];
    if (dupEmailsInFile.length)
      errors.push(`Email trùng trong file: ${dupEmailsInFile.join(', ')}`);
    if (dupPhonesInFile.length)
      errors.push(`SĐT trùng trong file: ${dupPhonesInFile.join(', ')}`);
    if (dupEmailsInDb.length)
      errors.push(`Email đã tồn tại: ${dupEmailsInDb.join(', ')}`);
    if (dupPhonesInDb.length)
      errors.push(`SĐT đã tồn tại: ${dupPhonesInDb.join(', ')}`);

    if (errors.length) throw new ConflictError(errors.join(' | '));

    // ===== 5) insert =====
    const customersToCreate = rows.map((r: any) => ({
      store_id: storeId,
      name: r.name,
      phone: r.phone ?? '',
      email: r.email ?? '',
      address: r.address ?? '',
      city: r.city ?? '',
      state: r.state ?? '',
      zip: r.zip ?? '',
      country: r.country ?? '',
    }));

    return this.prisma.customer.createMany({
      data: customersToCreate,
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
