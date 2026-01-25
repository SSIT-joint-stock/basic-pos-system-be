import { order_item_return_reason } from '@prisma/client';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class OrderReturnItemDto {
  @IsUUID()
  @IsNotEmpty({
    message: 'Vui lòng nhập mã đơn hàng',
  })
  order_item_id: string;

  @IsNumber()
  @Min(0, {
    message: 'Số lượng phải lớn hơn hoặc bằng 0',
  })
  quantity: number;

  @IsString()
  reason_status?: order_item_return_reason;

  @IsString()
  @IsOptional()
  condition?: string;
}
