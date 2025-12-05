import { UpdateUnitConversionDto } from 'app/module/unit-conversion/dto/update-unit-conversion.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

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
  conversions?: UpdateUnitConversionDto[];
}
