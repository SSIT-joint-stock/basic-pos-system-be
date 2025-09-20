import { stock_movement_type } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, NotEquals } from 'class-validator';

export class ApplyStockMovementDto {
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  delta: number;

  @IsEnum(stock_movement_type, { message: 'Invalid stock movement type' })
  type: stock_movement_type;
}
