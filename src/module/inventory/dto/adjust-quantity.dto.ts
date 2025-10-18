import { Type } from 'class-transformer';
import { IsInt, NotEquals } from 'class-validator';

export class AdjustInventoryDto {
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  delta: number;
}
