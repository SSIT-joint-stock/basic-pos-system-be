import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUnitConversionDto {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng chọn đơn vị chuyển đổi',
  })
  unit_id: string;
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  factor?: number;
}
