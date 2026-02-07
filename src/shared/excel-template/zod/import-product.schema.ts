import { z } from 'zod';

export const ImportProductSchema = z.object({
  product_name: z.string().nonempty({
    message: 'Vui lòng nhập tên sản phẩm',
  }),
  product_sku: z.string().optional(),
  base_unit: z.string().nonempty({
    message: 'Vui lòng nhập đơn vị tính',
  }),
  category_name: z.string().optional(),
  description: z.string().optional(),
  variant_name: z.string().optional(),
  variant_sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.string().optional(),
  cost: z.string().optional(),
  quantity: z.string().optional(),
});

export type IImportProduct = z.infer<typeof ImportProductSchema>;
