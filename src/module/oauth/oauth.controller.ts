import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { cookieConfig } from 'app/config';
import { type ConfigType } from '@nestjs/config';
import { Public } from 'app/common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { GoogleProfile } from 'app/common/types/google-profile.type';
import { Request, type Response } from 'express';

@Controller('oauth')
export class OauthController {
  constructor(
    @Inject(cookieConfig.KEY)
    private readonly configCookie: ConfigType<typeof cookieConfig>,
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
      const feURl = 'http://localhost:3000/oauth-success';
      console.log(req.user);
      const result = await this.oauthService.validateOauth(req.user);
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: this.configCookie.httpOnly,
        sameSite: this.configCookie.sameSite,
        domain: this.configCookie.domain || undefined,
        maxAge: this.configCookie.maxAge,
        secure: this.configCookie.secure,
      });
      res.redirect(feURl);
      return result;
    } catch (err) {
      console.log(err);
    }
  }
}
