import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BundleItemDto {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng chọn sản phẩm cho combo',
  })
  variantId: string;

  @IsNumber()
  @IsNotEmpty({
    message: 'Vui lòng nhập số lượng cho từng sản phẩm trong combo',
  })
  quantity: number; // Số lượng Variant
}
