import { IsArray, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class AcceptQuantityReturnDto {
  @IsArray()
  items: AcceptQuantityReturnItemDto[];
}
export class AcceptQuantityReturnItemDto {
  @IsString()
  @IsUUID()
  order_return_item_id: string;

  @IsNumber()
  @Min(0, {
    message: 'Vui lòng nhập lớn hơn hoặc bằng 0',
  })
  quantity: number;
}
