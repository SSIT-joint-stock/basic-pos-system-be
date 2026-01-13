import { AssetAction } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AssetAction, { each: true })
  actions: AssetAction[];
}
