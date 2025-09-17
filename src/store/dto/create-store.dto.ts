import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStoreDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  address?: string;
  @IsOptional()
  phone_number?: string;
  @IsOptional()
  business_hour?: string;
}
