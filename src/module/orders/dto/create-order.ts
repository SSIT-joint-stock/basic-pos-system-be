import { Type } from 'class-transformer';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { payment_method, order_status } from '@prisma/client';
import { CreateOrderItemDto } from './create-order-item';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsInt()
  @Min(0)
  subtotal_amount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discount_amount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tax_amount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_amount?: number;

  @IsOptional()
  @IsEnum(payment_method)
  payment_method?: payment_method;

  @IsOptional()
  @IsEnum(order_status)
  status?: order_status;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  order_items: CreateOrderItemDto[];
}
