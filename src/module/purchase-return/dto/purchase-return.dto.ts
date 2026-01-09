import { PurchaseReturnItemDto } from 'app/module/purchase-return/dto/purchase-return-item.dto';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class PurchaseReturnDto {
  @IsUUID()
  @IsOptional()
  purchase_order_id?: string;

  @IsUUID()
  @IsOptional()
  supplier_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsArray()
  items: PurchaseReturnItemDto[];
}
