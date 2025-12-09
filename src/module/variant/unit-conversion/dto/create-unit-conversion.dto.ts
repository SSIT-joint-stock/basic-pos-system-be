import { IsString, IsNumber } from 'class-validator';

export class CreateUnitConversionDto {
  @IsString()
  name: string;

  @IsNumber()
  factor: number;
}
