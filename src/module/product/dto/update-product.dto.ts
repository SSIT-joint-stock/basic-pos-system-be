import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { product_status } from '@prisma/client';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập tên sản phẩm',
  })
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  sku: string;

  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập đơn vị cơ bản',
  })
  @IsOptional()
  baseUnit: string;

  @IsOptional()
  @IsString()
  barcode?: string;

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

  @IsOptional()
  @IsBoolean()
  is_set_default_variant?: true;
}
