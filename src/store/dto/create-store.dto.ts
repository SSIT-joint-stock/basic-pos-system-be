import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStoreDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description?: string;
}
