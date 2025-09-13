import { IsString, IsOptional } from 'class-validator';

export class OAuthCallbackDto {
  @IsString()
  provider: string;

  @IsString()
  @IsOptional()
  code: string;

  @IsString()
  redirectUri: string;

  @IsString()
  @IsOptional()
  state?: string;
}
