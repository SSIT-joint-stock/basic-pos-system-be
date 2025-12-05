import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsUrl,
  IsObject,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { product_status } from '@prisma/client';

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
  @IsInt()
  initial_quantity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsBoolean()
  is_set_default_variant?: true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
