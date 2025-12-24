import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'app/common/decorators/public.decorator';
import { GoogleProfile } from 'app/common/types/google-profile.type';
import { apiConfig, cookieConfig } from 'app/config';
import { Request, type Response } from 'express';
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

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: this.configCookie.httpOnly,
        sameSite: this.configCookie.sameSite,
        domain: this.configCookie.domain || undefined,
        maxAge: this.configCookie.maxAge,
        secure: this.configCookie.secure,
      });
      const redirectUrlFe = result.hasStore
        ? `${this.configApi.fe_url}/auth/login/select-store`
        : `${this.configApi.fe_url}/auth/login/create-store`;
      res.redirect(redirectUrlFe);
      return result;
    } catch (err) {
      console.log(err);
    }
  }
}
