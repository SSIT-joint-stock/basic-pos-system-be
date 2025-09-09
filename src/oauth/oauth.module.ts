import { Module } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { SharedModule } from '../shared/shared.module';
import { TokenService } from 'app/auth/token.service';
import { PrismaService } from 'app/prisma/prisma.service';

@Module({
  imports: [SharedModule],
  controllers: [OAuthController],
  providers: [OAuthService, TokenService, PrismaService],
  exports: [OAuthService],
})
export class OAuthModule {}
