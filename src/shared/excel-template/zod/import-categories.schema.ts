import { z } from 'zod';

export const CategoryExcelSchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  description: z.string().optional(),
});

export type CategoryExcelRow = z.infer<typeof CategoryExcelSchema>;
