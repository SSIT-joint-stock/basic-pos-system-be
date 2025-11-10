// app/shared/excel-template/excel-template.service.ts
import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelTemplateProvider, TemplateKey } from './excel-template.types';

@Injectable()
export class ExcelTemplateService {
  private readonly registry = new Map<TemplateKey, ExcelTemplateProvider>();

  // KHÔNG dùng token: mảng providers sẽ được truyền qua useFactory ở module
  constructor(providers: ExcelTemplateProvider[]) {
    for (const p of providers) {
      // nếu trùng key, provider sau sẽ ghi đè
      this.registry.set(p.key, p);
    }
  }

  downloadExampleExcel(key: TemplateKey): StreamableFile {
    const provider = this.registry.get(key);
    if (!provider) {
      throw new NotFoundException(`Template '${key}' is not supported`);
    }

    const ws = XLSX.utils.json_to_sheet(provider.sample(), {
      header: provider.headers(),
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, provider.sheetName());

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fileName = provider.fileName(new Date());

    return new StreamableFile(buffer, {
      disposition: `attachment; filename="${fileName}"`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}
