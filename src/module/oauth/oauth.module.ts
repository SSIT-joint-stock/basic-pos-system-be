import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from '../auth/token.service';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { GoogleStrategy } from 'app/strategy/google.strategy';
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'google' })],
  controllers: [OauthController],
  providers: [OauthService, TokenService, GoogleStrategy],
})
export class OauthModule {}
