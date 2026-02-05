import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  product_id: string;

  @IsUUID()
  variant_id: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  discount_rate?: number;

  @IsOptional()
  tax_rate?: number;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  meta?: Record<string, any>;
}
