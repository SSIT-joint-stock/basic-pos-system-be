import { AssetVisibility } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateVisibilityDto {
  @IsEnum(AssetVisibility)
  visibility: AssetVisibility;
}
