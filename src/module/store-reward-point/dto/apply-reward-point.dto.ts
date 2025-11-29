import { IsOptional } from 'class-validator';

export class ApplyRewardPointDto {
  @IsOptional()
  convert_rate?: number;
  @IsOptional()
  point_value?: number;
  @IsOptional()
  description?: string;
  @IsOptional()
  is_apply?: boolean;
}
