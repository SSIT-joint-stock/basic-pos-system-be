// src/modules/stock/dto/create-stock-movement.dto.ts

import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { stock_movement_type } from '@prisma/client';

export class CreateStockMovementDto {
  @IsUUID()
  @IsNotEmpty()
  product_id!: string; // UUID của sản phẩm

  @IsEnum(stock_movement_type)
  @IsNotEmpty()
  type!: stock_movement_type;
  // 'ADJUSTMENT' | 'PURCHASE' | 'SALE' | 'RETURN_IN' | 'RETURN_OUT' | 'TRANSFER'

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number; // số lượng thay đổi (luôn > 0, dấu sẽ do type quyết định)

  @IsOptional()
  @IsString()
  note?: string; // ghi chú thêm (nếu có)

  @IsOptional()
  @IsUUID()
  related_order_id?: string; // nếu movement liên quan tới 1 order
}
