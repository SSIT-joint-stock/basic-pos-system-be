import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConflictError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { ImportValidationService } from './import-validation.service';
import { UniqueRule } from './import.types';

export abstract class BaseImportService<
  TExcelRow extends Record<string, any>,
  TCreate,
> {
  constructor(
    protected readonly excelService: ExcelTemplateService,
    protected readonly prisma: PrismaService,
    protected readonly validator: ImportValidationService,
  ) {}

  // ===== entity-specific config =====
  protected abstract template: any;
  protected abstract prismaDelegateKey: keyof PrismaService;
  protected abstract uniqueRules: ReadonlyArray<UniqueRule<TExcelRow>>;

  protected abstract normalizeRow(r: any): TExcelRow;
  protected abstract toCreate(row: TExcelRow, storeId: string): TCreate;

  // hook: ví dụ generate code cho dòng thiếu
  protected preprocessRows(
    _storeId: string,
    rows: TExcelRow[],
  ): Promise<TExcelRow[]> {
    return Promise.resolve(rows);
  }

  // ===== public APIs =====
  async downloadExample() {
    return this.excelService.generateTemplateExample(this.template);
  }

  async exportExcel(storeId: string, mapExport: (x: any) => any) {
    await this.checkStore(storeId);

    const delegate: any = (this.prisma as any)[this.prismaDelegateKey];
    const items = await delegate.findMany({ where: { store_id: storeId } });

    return this.excelService.exportData(this.template, items.map(mapExport));
  }

  async importExcel(storeId: string, file: Express.Multer.File) {
    await this.checkStore(storeId);

    // 1) read excel
    const raw = await this.excelService.importData<any>(this.template, file);

    // 2) normalize + preprocess (entity custom)
    let rows = raw.map((r: any) => this.normalizeRow(r));
    rows = await this.preprocessRows(storeId, rows);

    // 3) build existing sets for unique fields
    const existingSets = await this.buildExistingSets(storeId, rows);

    // 4) validate
    const errors: string[] = [];
    for (const rule of this.uniqueRules) {
      const key = String(rule.field);
      const set = existingSets[key] ?? new Set<string>();

      errors.push(...this.validator.validateUniqueFields(rows, rule, set));
    }

    if (errors.length) throw new ConflictError(errors.join(' | '));

    // 5) insert
    const data = rows.map((r) => this.toCreate(r, storeId));
    const delegate: any = (this.prisma as any)[this.prismaDelegateKey];
    return delegate.createMany({ data });
  }

  // ===== internals =====
  private async buildExistingSets(
    storeId: string,
    rows: TExcelRow[],
  ): Promise<Record<string, Set<string>>> {
    const delegate: any = (this.prisma as any)[this.prismaDelegateKey];

    // build OR query from input values
    const or: any[] = [];

    for (const rule of this.uniqueRules) {
      const normalize = rule.normalize ?? ((v: any) => (v ? String(v) : null));

      const values = rows
        .map((r) => normalize(r[rule.field]))
        .filter(Boolean) as string[];

      const uniq = [...new Set(values)];
      if (uniq.length) {
        or.push({ [String(rule.field)]: { in: uniq } });
      }
    }

    // init result sets for all fields (always return keys)
    const sets: Record<string, Set<string>> = {};
    for (const rule of this.uniqueRules) {
      sets[String(rule.field)] = new Set<string>();
    }

    // nothing to check => return empty sets
    if (!or.length) return sets;

    // query existing
    const select = Object.fromEntries(
      this.uniqueRules.map((r) => [String(r.field), true]),
    );

    const existing = await delegate.findMany({
      where: { store_id: storeId, OR: or },
      select,
    });

    // fill sets
    for (const item of existing) {
      for (const rule of this.uniqueRules) {
        const normalize =
          rule.normalize ?? ((v: any) => (v ? String(v) : null));
        const v = normalize(item[String(rule.field)]);
        if (v) sets[String(rule.field)].add(v);
      }
    }

    return sets;
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
