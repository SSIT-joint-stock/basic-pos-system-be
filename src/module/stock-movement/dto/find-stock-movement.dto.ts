// src/modules/stock/dto/create-stock-movement.dto.ts

import { IsOptional, IsInt, Min, IsNotEmpty, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { stock_movement_type } from '@prisma/client';

export class FindStockMovementDto {
  @IsOptional()
  @IsEnum(stock_movement_type)
  @IsNotEmpty()
  type!: stock_movement_type;
  // 'ADJUSTMENT' | 'PURCHASE' | 'SALE' | 'RETURN_IN' | 'RETURN_OUT' | 'TRANSFER'

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  min_quantity!: number; // số lượng thay đổi (luôn > 0, dấu sẽ do type quyết định)

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  max_quantity!: number; // số lượng thay đổi (luôn > 0, dấu sẽ do type quyết định)
}
