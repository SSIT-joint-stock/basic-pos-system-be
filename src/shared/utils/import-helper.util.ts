export class ImportHelper {
  static findDuplicates<T>(arr: T[]): T[] {
    const m = new Map<T, number>();
    for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
    return [...m.entries()].filter(([, n]) => n > 1).map(([x]) => x);
  }

  static normalizeEmail(v: any): string | null {
    const s = String(v ?? '')
      .trim()
      .toLowerCase();
    return s.length ? s : null;
  }

  static normalizePhone(v: any): string | null {
    const s = String(v ?? '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/[-.]/g, '');
    return s.length ? s : null;
  }

  static normalizeText(v: any): string | null {
    const s = String(v ?? '').trim();
    return s.length ? s : null;
  }

  static normalizeCode(v: any): string | null {
    const s = String(v ?? '')
      .trim()
      .toUpperCase();
    return s.length ? s : null;
  }

  static parseEnum<
    TEnum extends Record<string, string | number>,
    TValue extends TEnum[keyof TEnum],
  >(v: any, enumObj: TEnum, fallback: TValue): TValue {
    const raw = String(v ?? '').trim();
    if (!raw) return fallback;

    // match không phân biệt hoa/thường theo KEY hoặc VALUE
    const upper = raw.toUpperCase();

    for (const key of Object.keys(enumObj)) {
      const value = enumObj[key] as unknown as string | number;

      // match theo key (ACTIVE) hoặc theo value ("ACTIVE")
      if (String(key).toUpperCase() === upper) return enumObj[key] as TValue;
      if (String(value).toUpperCase() === upper) return value as TValue;
    }

    return fallback;
  }
}
