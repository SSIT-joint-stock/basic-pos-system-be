import { z } from 'zod';

// required string: trim + không rỗng
const zTrimmedRequired = z
  .string()
  .trim()
  .min(1, 'Tên nhà cung cấp không được để trống');

// optional text: null/undefined/"" => undefined, còn lại trim
const zOptionalText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return undefined;
    const t = String(v).trim();
    return t.length ? t : undefined;
  });

// optional non-negative number (Excel có thể là number hoặc string)
const zOptionalNonNegativeNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return undefined;
    if (typeof v === 'number') return v;

    const s = String(v).trim();
    if (!s) return undefined;

    // "1,234.56" -> "1234.56"
    const normalized = s.replace(/\s+/g, '').replace(/,/g, '');

    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  })
  .refine((n) => n === undefined || (!Number.isNaN(n) && n >= 0), {
    message: 'Tổng mua (total_purchased) phải là số và >= 0',
  });

export const SupplierExcelSchema = z.object({
  code: zOptionalText, // có thể trống để hệ thống generate
  name: zTrimmedRequired,

  contact_person: zOptionalText,
  address: zOptionalText,
  tax_code: zOptionalText,

  email: zOptionalText.refine(
    (v) => v === undefined || z.string().email().safeParse(v).success,
    { message: 'Email không hợp lệ' },
  ),

  phone: zOptionalText,

  // nhập JSON string hoặc để trống
  bank_account: zOptionalText.transform((v) => {
    if (v === undefined) return undefined;
    try {
      return JSON.parse(v);
    } catch {
      return v; // hoặc return undefined nếu bạn muốn bỏ qua khi sai JSON
    }
  }),

  notes: zOptionalText,

  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),

  total_purchased: zOptionalNonNegativeNumber,
});

export type SupplierExcelRow = z.infer<typeof SupplierExcelSchema>;
