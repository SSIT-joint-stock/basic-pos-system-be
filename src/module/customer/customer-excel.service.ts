/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { CUSTOMER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/customer';
import { BaseImportService } from 'app/shared/import-excel/base-import.service';
import { ImportValidationService } from 'app/shared/import-excel/import-validation.service';
import { ImportHelper } from 'app/shared/utils/import-helper.util';

type CustomerExcelRow = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
};

@Injectable()
export class ImportCustomerService extends BaseImportService<
  CustomerExcelRow,
  any
> {
  protected template = CUSTOMER_EXCEL_TEMPLATE;
  protected prismaDelegateKey: keyof PrismaService = 'customer';

  protected uniqueRules = [
    {
      field: 'email',
      label: 'Email',
      normalize: (v) => ImportHelper.normalizeEmail(v),
    },
    {
      field: 'phone',
      label: 'SĐT',
      normalize: (v) => ImportHelper.normalizePhone(v),
    },
  ] as const;

  constructor(
    excelService: ExcelTemplateService,
    prisma: PrismaService,
    validator: ImportValidationService,
  ) {
    super(excelService, prisma, validator);
  }

  async exportCustomerExcel(storeId: string) {
    return this.exportExcel(storeId, (c: any) => ({
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
  }

  protected normalizeRow(r: any): CustomerExcelRow {
    return {
      name: ImportHelper.normalizeText(r.name) ?? '',
      phone: ImportHelper.normalizePhone(r.phone),
      email: ImportHelper.normalizeEmail(r.email),
      address: ImportHelper.normalizeText(r.address),
      city: ImportHelper.normalizeText(r.city),
      state: ImportHelper.normalizeText(r.state),
      zip: ImportHelper.normalizeText(r.zip),
      country: ImportHelper.normalizeText(r.country),
    };
  }

  protected toCreate(row: CustomerExcelRow, storeId: string) {
    return {
      store_id: storeId,
      name: row.name,
      phone: row.phone ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      zip: row.zip ?? '',
      country: row.country ?? '',
    };
  }
}
