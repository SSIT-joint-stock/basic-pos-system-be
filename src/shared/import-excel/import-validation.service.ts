import { Injectable } from '@nestjs/common';
import { ImportHelper } from 'app/shared/utils/import-helper.util';
import { UniqueRule } from './import.types';

@Injectable()
export class ImportValidationService {
  validateUniqueFields<T extends Record<string, any>>(
    rows: T[],
    rule: UniqueRule<T>,
    existingValuesInDb: Set<string>,
  ): string[] {
    const normalize =
      rule.normalize ?? ((v: any) => (v ? String(v).trim() : null));

    const values = rows
      .map((r) => normalize(r[rule.field]))
      .filter(Boolean) as string[];

    const uniqValues = [...new Set(values)];

    // 1) trùng trong file
    const dupInFile = ImportHelper.findDuplicates(values);

    // 2) trùng với DB
    const dupInDb = uniqValues.filter((v) => existingValuesInDb.has(v));

    const errors: string[] = [];
    if (dupInFile.length)
      errors.push(`${rule.label} trùng trong file: ${dupInFile.join(', ')}`);
    if (dupInDb.length)
      errors.push(`${rule.label} đã tồn tại: ${dupInDb.join(', ')}`);

    return errors;
  }
}
