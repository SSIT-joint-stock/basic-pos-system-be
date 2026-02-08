import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class PurchaseOrderItemDto {
  @IsUUID()
  product_id: string; // Nếu sản phẩm đã có thì dùng ID

  @IsUUID()
  variant_id: string;

  @IsOptional()
  isStatus?: boolean;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  unit: string;

  @IsNumber()
  @IsOptional()
  applied_factor: number;

  @IsNumber()
  @IsOptional()
  total_base_qty: number;

  @IsNumber()
  @Min(0)
  unit_cost: number; // giá nhập

  @IsNumber()
  @IsOptional()
  discount_rate?: number; // phần trăm chiết khấu / per item

  @IsNumber()
  @IsOptional()
  tax_rate?: number; // phần trăm thư phiếu / per item

  @IsOptional()
  subtotal?: number;

  @IsOptional()
  discount_amount?: number;

  @IsOptional()
  tax_amount?: number;

  @IsOptional()
  total?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
