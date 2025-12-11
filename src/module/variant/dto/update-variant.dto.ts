import { UpdateUnitConversionDto } from 'app/module/variant/unit-conversion/dto/update-unit-conversion.dto';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { IsUniqueUnitNamesConstraint } from '../unit-conversion/validators/unique-unit-names.validator';
import { CreateUnitConversionDto } from '../unit-conversion/dto/create-unit-conversion.dto';

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
  cost?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitConversionDto)
  @Validate(IsUniqueUnitNamesConstraint)
  conversions?: UpdateUnitConversionDto[];
}
