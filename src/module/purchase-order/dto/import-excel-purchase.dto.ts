import { PurchaseOrderItemDto } from 'app/module/purchase-order/dto/purchase-order-item.dto';
import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';

export class ImportExcelPurchaseDto {
  @IsNotEmpty({
    message: 'Vui lòng chọn nhà cung cấp',
  })
  supplier_id: string;

  @IsOptional()
  order_date: Date;

  @IsArray()
  items: PurchaseOrderItemDto[];
}
