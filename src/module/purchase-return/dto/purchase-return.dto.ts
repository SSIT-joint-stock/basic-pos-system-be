import { PurchaseReturnItemDto } from 'app/module/purchase-return/dto/purchase-return-item.dto';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class PurchaseReturnWithPODto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  return_date?: Date;

  @IsArray()
  items: PurchaseReturnItemDto[];
}

export class PurchaseReturnWithoutPODto {
  @IsUUID()
  @IsNotEmpty({
    message: 'Vui lòng chọn nhà cung cấp',
  })
  supplier_id: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsArray()
  items: PurchaseReturnItemDto[];
}
