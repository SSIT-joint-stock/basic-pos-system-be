import { IsOptional, IsUppercase } from 'class-validator';

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
  bank_code?: string;
  @IsOptional()
  bank_name?: string;
  @IsOptional()
  bank_account_number?: string;
  @IsOptional()
  @IsUppercase()
  bank_account_name?: string;
  @IsOptional()
  bank_qr_image_url?: string;
}
