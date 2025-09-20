import { Type } from 'class-transformer';
import { IsInt, IsUUID, NotEquals } from 'class-validator';

export class AdjustStockDto {
  @IsUUID('4')
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  delta: number;
}
