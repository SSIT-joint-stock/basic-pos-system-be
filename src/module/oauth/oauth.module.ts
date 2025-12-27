import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from 'app/module/auth/auth.module';
import { GoogleStrategy } from 'app/strategy/google.strategy';
import { TokenService } from '../auth/token.service';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'google' }), AuthModule],
  controllers: [OauthController],
  providers: [OauthService, TokenService, GoogleStrategy],
})
export class OauthModule {}
