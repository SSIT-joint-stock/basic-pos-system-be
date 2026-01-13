import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsOptional()
  @IsString()
  field?: string;
}
