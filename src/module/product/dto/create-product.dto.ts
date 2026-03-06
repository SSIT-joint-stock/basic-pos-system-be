import { product_status } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập tên sản phẩm',
  })
  name: string;

  @IsString()
  @IsOptional()
  sku: string;

  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập đơn vị cơ bản',
  })
  baseUnit: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  image_url?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(product_status)
  @IsOptional()
  product_status?: product_status = product_status.ACTIVE;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  meta?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [value];
      }
    }
    return value;
  })
  categoryIds?: string[];

  @IsOptional()
  @IsBoolean()
  is_set_default_variant?: true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [value];
      }
    }
    return value;
  })
  tagIds?: string[];
}
