import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsUrl,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { product_status } from '@prisma/client';

export class FilterProductsDto {
  @IsOptional() @IsString() q?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  min_price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  max_price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  min_cost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  max_cost?: number;

  @IsOptional()
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
}
