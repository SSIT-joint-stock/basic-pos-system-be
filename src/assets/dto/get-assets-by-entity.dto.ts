import { IsNotEmpty, IsString } from 'class-validator';

export class GetAssetsByEntityDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;
}
