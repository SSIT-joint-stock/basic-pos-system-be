import { IsOptional, IsString } from 'class-validator';

export class UpdateInfoMemberDto {
  @IsString()
  @IsOptional()
  email: string;
  @IsOptional()
  @IsString()
  username: string;
}
