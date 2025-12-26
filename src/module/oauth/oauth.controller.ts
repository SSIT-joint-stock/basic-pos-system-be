import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'app/common/decorators/public.decorator';
import { UnauthorizedError } from 'app/common/response';
import { GoogleProfile } from 'app/common/types/google-profile.type';
import { apiConfig, cookieConfig } from 'app/config';
import express, { Request, type Response } from 'express';
import { OauthService } from './oauth.service';

@Controller('oauth')
export class OauthController {
  constructor(
    @Inject(cookieConfig.KEY)
    private readonly configCookie: ConfigType<typeof cookieConfig>,
    @Inject(apiConfig.KEY)
    private readonly configApi: ConfigType<typeof apiConfig>,
    private readonly oauthService: OauthService,
  ) {}
  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleAuth() {}

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('/google/callback')
  async googleCallback(
    @Req()
    req: Request & {
      user: GoogleProfile & { accessToken: string; refreshToken: string };
    },
    @Res() res: Response,
  ) {
    // Handle the Google OAuth callback
    try {
      const result = await this.oauthService.validateOauth(req.user);

      if (!result.user.is_verified) {
        return res.redirect(
          `${this.configApi.fe_url}/auth/login?error=account_not_verified`,
        );
      }

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: this.configCookie.httpOnly,
        sameSite: this.configCookie.sameSite,
        path: '/',
        domain: this.configCookie.domain || undefined,
        maxAge: this.configCookie.maxAge,
        secure: this.configCookie.secure,
      });

      res.cookie('provider_id', result.user.provider_id, {
        httpOnly: this.configCookie.httpOnly,
        sameSite: this.configCookie.sameSite,
        path: '/',
        domain: this.configCookie.domain || undefined,
        maxAge: this.configCookie.maxAge,
        secure: this.configCookie.secure,
      });

      const redirectUrl = `${this.configApi.fe_url}/oauth?hasStore=${result.hasStore}`;
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('OAuth Error:', err);
      return res.redirect(
        `${this.configApi.fe_url}/auth/login?error=server_error`,
      );
    }
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken: string = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedError(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!',
      );
    }

    try {
      // Call service với refresh token
      const result = await this.oauthService.refreshToken(refreshToken);

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: this.configCookie.httpOnly,
        sameSite: this.configCookie.sameSite,
        domain: this.configCookie.domain || undefined,
        maxAge: this.configCookie.maxAge,
        secure: this.configCookie.secure,
      });

      return {
        access_token: result.access_token,
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role,
        },
        stores: result.stores,
        token_type: 'Bearer',
        expires_in: 900,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.clearCookie('refresh_token');
        res.clearCookie('provider_id');
      }
    }
  }
}
