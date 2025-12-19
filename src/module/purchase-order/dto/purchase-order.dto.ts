import { IsUUID, IsOptional, IsArray, IsString } from 'class-validator';
import { PurchaseOrderItemDto } from './purchase-order-item.dto';

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplier_id: string;

  @IsOptional()
  order_number?: string;

  @IsOptional()
  order_date?: Date;

  @IsOptional()
  expected_date?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  items: PurchaseOrderItemDto[];
}
