import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ImportProductItemDto {
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsString()
  @IsOptional()
  product_sku?: string;

  @IsString()
  @IsNotEmpty()
  base_unit: string;

  @IsString()
  @IsOptional()
  category_name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  variant_name: string;

  @IsString()
  @IsOptional()
  variant_sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsBoolean()
  @IsOptional()
  isStatus?: boolean;

  @IsString()
  @IsOptional()
  msg?: string;
}

export class ImportExcelProductDto {
  @IsArray()
  items: ImportProductItemDto[];
}

// Dạng lỗi để trả về
export type ImportValidationError = {
  rowIndex: number;
  issues: string[];
};
