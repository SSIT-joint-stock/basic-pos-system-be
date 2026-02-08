import { AssetVisibility } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class UploadAssetDto {
  @IsOptional()
  @IsEnum(AssetVisibility)
  visibility?: AssetVisibility;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInSeconds?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
