import { Type } from 'class-transformer';
import { IsUUID, IsInt, NotEquals } from 'class-validator';

export class AdjustInventoryDto {
  @IsUUID('4')
  userId: string;

  @IsUUID('4')
  product_id: string;

  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  delta: number;
}
