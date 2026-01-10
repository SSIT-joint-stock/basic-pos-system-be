import { IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
export class PurchaseReturnItemDto {
  @IsOptional()
  variant_id?: string;

  @IsOptional()
  product_id?: string;

  @IsOptional()
  @IsUUID()
  purchase_order_item_id?: string;

  @IsNotEmpty({
    message: 'Vui lòng nhập giá tiền',
  })
  @Min(0, {
    message: 'Giá tiền phải lớn hơn 0',
  })
  unit_cost: number;

  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập tên sản phẩm',
  })
  item_name: string;

  @IsNotEmpty({
    message: 'Vui lòng nhập số lượng',
  })
  @Min(0, {
    message: 'Số lượng phải lớn hơn 0',
  })
  quantity: number;

  @IsOptional()
  reason?: string;
}
