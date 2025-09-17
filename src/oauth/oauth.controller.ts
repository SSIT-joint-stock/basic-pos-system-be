import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { OAuthService } from './oauth.service';
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
    @Query('state') state: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const callbackParams: OAuthCallbackDto = {
      provider: 'google',
      code,
      state,
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

      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
      },
    };
  }
}
