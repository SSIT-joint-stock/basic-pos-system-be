import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { CreateUnitConversionDto } from '../unit-conversion/dto/create-unit-conversion.dto';
import { Type } from 'class-transformer';
import { IsUniqueUnitNamesConstraint } from '../unit-conversion/validators/unique-unit-names.validator';

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
  cost?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitConversionDto)
  @Validate(IsUniqueUnitNamesConstraint)
  conversions?: CreateUnitConversionDto[];
}
