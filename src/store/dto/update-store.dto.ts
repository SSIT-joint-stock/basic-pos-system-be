import { IsOptional } from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  name?: string;
  @IsOptional()
  description?: string;
}
