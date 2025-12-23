import { z } from 'zod';

// required: trim + không rỗng
const zTrimmedRequired = z
  .string()
  .trim()
  .min(1, 'Tên khách hàng không được để trống');

// optional text: "" => undefined
const zOptionalText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return undefined;
    const t = String(v).trim();
    return t.length ? t : undefined;
  });

export const CustomerExcelSchema = z.object({
  name: zTrimmedRequired,
  phone: zOptionalText,
  email: zOptionalText.refine(
    (v) => v === undefined || z.string().email().safeParse(v).success,
    { message: 'Email không hợp lệ' },
  ),
  address: zOptionalText,
  city: zOptionalText,
  state: zOptionalText,
  zip: zOptionalText,
  country: zOptionalText,
  createdAt: zOptionalText.optional(), // Excel service đang ép string; nếu chưa xử lý Date thì để optional
});

export type CustomerExcelRow = z.infer<typeof CustomerExcelSchema>;
