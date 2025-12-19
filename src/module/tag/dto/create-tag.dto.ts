import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsNotEmpty({
    message: 'Tên tag không được để trống',
  })
  @IsString()
  name: string;
  @IsOptional()
  description?: string;
}
