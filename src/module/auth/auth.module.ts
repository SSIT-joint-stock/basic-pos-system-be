import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptService } from 'app/common/helpers/bcrypt.util';
import { CodeService } from 'app/common/helpers/code.util';
import jwtConfig from 'app/config/jwt.config';
import { EmailService } from 'app/email/email.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UsersModule } from 'app/module/users/users.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    EmailService,
    CodeService,
    TokenService,
    BcryptService,
  ],
  imports: [UsersModule, ConfigModule.forFeature(jwtConfig)],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
