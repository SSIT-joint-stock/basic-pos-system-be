import {
  IsUUID,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  IsString,
} from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsOptional()
  @IsUUID()
  product_id?: string; // Nếu sản phẩm đã có thì dùng ID

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_cost: number; // giá nhập

  @IsNumber()
  @IsOptional()
  discount_rate?: number; // phần trăm chiết khấu / per item

  @IsNumber()
  @IsOptional()
  tax_rate?: number; // phần trăm thư phiếu / per item

  @IsString()
  @IsOptional()
  notes?: string;
}

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
  items: CreatePurchaseOrderItemDto[];
}
