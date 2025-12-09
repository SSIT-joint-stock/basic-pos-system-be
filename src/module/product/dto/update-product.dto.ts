import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { product_status } from '@prisma/client';
import { Type } from 'class-transformer';

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

  @IsInt()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  cost: number;

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
  meta?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsBoolean()
  is_set_default_variant?: true;
}
