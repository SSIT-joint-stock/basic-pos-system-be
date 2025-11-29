import { IsOptional } from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  name?: string;
  @IsOptional()
  description?: string;
  @IsOptional()
  address?: string;
  @IsOptional()
  phone_number?: string;
  @IsOptional()
  business_hour?: string;
  @IsOptional()
  city?: string;
  @IsOptional()
  state?: string;
}
