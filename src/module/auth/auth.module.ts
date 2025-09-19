import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'app/users/users.module';
import { PrismaService } from 'app/prisma/prisma.service';
import { EmailService } from 'app/email/email.service';
import { CodeService } from 'app/common/helpers/code.util';
import { TokenService } from './token.service';
import { BcryptService } from 'app/common/helpers/bcrypt.util';

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
  imports: [UsersModule],
})
export class AuthModule {}
