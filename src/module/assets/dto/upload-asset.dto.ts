import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum AssetAccessTypeDto {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  TEMP = 'TEMP',
}

export class UploadAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  folder?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;

  @IsOptional()
  @IsEnum(AssetAccessTypeDto)
  accessType?: AssetAccessTypeDto;
}
