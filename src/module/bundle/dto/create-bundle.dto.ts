import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BundleItemDto } from './bundle-item.dto';

export class CreateBundleDto {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập tên cho combo',
  })
  name: string;

  @IsNumber()
  @IsNotEmpty({
    message: 'Vui lòng nhập giá cho combo',
  })
  price: number;

  @IsNumber()
  @IsNotEmpty({
    message: 'Vui lòng nhập số lượng cho combo',
  })
  quantity: number;

  @IsString()
  @IsOptional()
  sku: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  @IsNotEmpty({
    message: 'Vui lòng thêm sản phẩm vào combo',
  })
  items: BundleItemDto[];
}
