import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
  IsUrl,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { product_status } from '@prisma/client';

export class CreateProductDto {
  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

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

  @IsUUID()
  @IsNotEmpty()
  created_by: string;
}
