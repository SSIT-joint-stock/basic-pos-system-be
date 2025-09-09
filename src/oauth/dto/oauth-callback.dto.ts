import { IsString, IsOptional } from 'class-validator';

export class OAuthCallbackDto {
  @IsString()
  provider: string;

  @IsString()
  code: string;

  @IsString()
  redirectUri: string;

  @IsString()
  @IsOptional()
  state?: string;
}
