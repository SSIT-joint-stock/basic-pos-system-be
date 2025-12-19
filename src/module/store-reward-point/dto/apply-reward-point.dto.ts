import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class ApplyRewardPointDto {
  @IsNumber()
  @IsNotEmpty({
    message: 'Vui lòng nhập tỷ lệ quy đổi điểm',
  })
  convert_rate: number;

  @IsNumber()
  @IsNotEmpty({
    message: 'Vui lòng nhập số lượng điểm cần áp dụng',
  })
  point_value: number;

  @IsOptional()
  description?: string;

  @IsOptional()
  is_apply?: boolean;
}
