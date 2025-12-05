import { CreateUnitConversionDto } from 'app/module/unit-conversion/dto/create-unit-conversion.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập tên biến thể',
  })
  name: string;

  @IsString()
  @IsOptional()
  sku: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  conversions?: CreateUnitConversionDto[];
}
