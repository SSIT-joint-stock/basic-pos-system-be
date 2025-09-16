import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  product_id: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  meta?: Record<string, any>;
}
