import { product_status } from '@prisma/client';
import z from 'zod';

const toNumber = z.union([z.number(), z.string()]).transform((v) => {
  if (typeof v === 'number') return v;
  const n = Number((v ?? '').toString().replace(/[, ]+/g, ''));
  return Number.isFinite(n) ? n : 0;
});

export const ProductStatusEnum = z.enum(product_status);

export const ImportProductRowSchema = z.object({
  name: z.string().min(1, 'name is required'),
  sku: z.string().min(1, 'sku is required').max(128),
  barcode: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v == null ? undefined : String(v))),
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
  product_status: z
    .preprocess(
      (v) =>
        String(v ?? 'ACTIVE')
          .toUpperCase()
          .trim(),
      ProductStatusEnum,
    )
    .default('ACTIVE'),
});

export type ImportProductRow = z.infer<typeof ImportProductRowSchema>;

// Dạng lỗi để trả về
export type ImportValidationError = {
  rowIndex: number; // dòng Excel (bắt đầu từ 2)
  issues: string[];
};
