import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class RevalueInventoryDto {
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Discount must be an integer' })
  @Min(0, { message: 'Discount must be a non-negative integer' })
  discount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Total must be an integer' })
  @Min(0, { message: 'Total must be a non-negative integer' })
  total?: number;
}
