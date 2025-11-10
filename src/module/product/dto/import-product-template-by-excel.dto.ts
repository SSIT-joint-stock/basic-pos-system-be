import z from 'zod';

const toNumber = z.union([z.number(), z.string()]).transform((v) => {
  if (typeof v === 'number') return v;
  const n = Number((v ?? '').toString().replace(/[, ]+/g, ''));
  return Number.isFinite(n) ? n : 0;
});

// Helper: ép về string, trim, và yêu cầu không rỗng
const toNonEmptyString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v ?? '').trim())
  .pipe(z.string().min(1));

export const ImportProductTemplateRowSchema = z.object({
  name: z.string().min(1, 'name is required'),
  // barcode: bắt buộc, nhận cả string/number, trim, không rỗng
  barcode: toNonEmptyString.refine((s) => s.length > 0, {
    message: 'barcode is required',
  }),

  price: toNumber.default(0),
  cost: toNumber.default(0),
  description: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v == null ? undefined : String(v))),
  image_url: z
    .string()
    .url('image_url must be a valid URL')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  category: z.string().min(1, 'category is required'),
});

export type ImportProductTemplateRow = z.infer<
  typeof ImportProductTemplateRowSchema
>;

// Dạng lỗi để trả về
export type ImportValidationError = {
  rowIndex: number; // dòng Excel (bắt đầu từ 2)
  issues: string[];
};
