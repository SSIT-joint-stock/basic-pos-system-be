import { IsOptional, IsString } from 'class-validator';

export class OAuthInitDto {
  @IsString()
  provider: string;

  @IsString()
  redirectUri: string;

  @IsString()
  @IsOptional()
  state?: string;
}
