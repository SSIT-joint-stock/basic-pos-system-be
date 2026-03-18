import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;
}
