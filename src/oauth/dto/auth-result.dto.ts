import { IsString, IsOptional, IsObject } from 'class-validator';

export class AuthResultDto {
  @IsObject()
  user: object;

  @IsString()
  @IsOptional()
  googleAccessToken?: string;

  @IsString()
  @IsOptional()
  googleRefreshToken?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;
}
