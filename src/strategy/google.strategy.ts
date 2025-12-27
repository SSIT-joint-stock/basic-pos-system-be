import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { oauthConfig } from 'app/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(oauthConfig.KEY) configOauth: ConfigType<typeof oauthConfig>,
  ) {
    const { clientId, clientSecret, callbackURL, scopes } = configOauth;
    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: scopes,
    });
  }
  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      done(null, profile);
    } catch (error) {
      done(error, false);
    }
  }
}
