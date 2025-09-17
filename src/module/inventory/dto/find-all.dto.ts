// src/modules/stock/dto/create-stock-movement.dto.ts

import { IsOptional, IsInt, Min, IsNotEmpty, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { inventory_status } from '@prisma/client';

export class FindInventoryDto {
  @IsOptional()
  @IsEnum(inventory_status)
  @IsNotEmpty()
  status!: inventory_status;

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

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  min_discount!: number; // số lượng thay đổi (luôn > 0, dấu sẽ do type quyết định)

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  max_discount!: number; // số lượng thay đổi (luôn > 0, dấu sẽ do type quyết định)

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  min_total!: number; // số lượng thay đổi (luôn > 0, dấu sẽ do type quyết định)

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  max_total!: number; // số lượng thay đổi (luôn > 0, dấu sẽ do type quyết định)
}
