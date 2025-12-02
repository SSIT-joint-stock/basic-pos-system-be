import {
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsEnum,
  IsNumber,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { supplier_status } from '@prisma/client';

export class CreateSupplierDto {
  @IsOptional()
  @IsString()
  code: string;

  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập tên nhà cung cấp',
  })
  name: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  tax_code?: string;

  @IsOptional()
  @IsObject()
  bank_account?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(supplier_status)
  status?: supplier_status;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  total_purchased?: number;
}
