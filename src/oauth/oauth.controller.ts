import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthResponse, OAuthService } from './oauth.service';
import { OAuthInitDto } from './dto/oauth-init.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { Public } from 'app/common/decorators/public.decorator';
import express from 'express';
// import { User } from '@prisma/client';

@Controller('auth')
export class OAuthController {
  constructor(private readonly authService: OAuthService) {}

  @Public()
  @Get('init')
  googleAuth(@Res() res: express.Response) {
    const initParams: OAuthInitDto = {
      provider: 'google',
      redirectUri: 'http://localhost:3000/api/v1/auth/callback',
    };
    const { authUrl } = this.authService.init(initParams);
    console.log(authUrl);
    return res.redirect(authUrl);
  }

  @Public()
  @Get('callback')
  async googleAuthCallback(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthResponse> {
    const callbackParams: OAuthCallbackDto = {
      provider: 'google',
      code,
      redirectUri: 'http://localhost:3000/api/v1/auth/callback',
    };
    const result = await this.authService.callback(callbackParams);
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      accessToken: result.accessToken || '',
      refreshToken: result.refreshToken || '',
      googleRefreshToken: result.googleRefreshToken || '',
      googleAccessToken: result.googleAccessToken || '',

      user: result.user,
    };
  }
}
