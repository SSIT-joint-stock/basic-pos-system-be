import { OrderReturnItemDto } from 'app/module/order-return/dto/order-return-item.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class OrderReturnDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsArray()
  items: OrderReturnItemDto[];
}
