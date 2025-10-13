import { Module } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { TokenService } from 'app/auth/token.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { UsersService } from 'app/users/users.service';
import { appConfig } from 'app/config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forFeature(appConfig)],
  controllers: [OAuthController],
  providers: [OAuthService, TokenService, PrismaService, UsersService],
  exports: [OAuthService],
})
export class OAuthModule {}
