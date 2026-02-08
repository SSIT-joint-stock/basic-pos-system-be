import { z } from 'zod';

export const PurchaseOrderSchema = z.object({
  item_name: z.string().nonempty({
    message: 'Vui lòng nhập tên sản phẩm',
  }),
  base_unit: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().nonempty({
    message: 'Vui lòng nhập sku',
  }),
  barcode: z.string().optional(),
  unit_cost: z.string().nonempty({
    message: 'Vui lòng nhập giá nhập',
  }),
  price: z.string().optional(),
  quantity: z.string().nonempty({
    message: 'Vuiź nhập số lượng',
  }),
  tax_rate: z.string().optional(),
  discount_rate: z.string().optional(),
});

export type IPurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
