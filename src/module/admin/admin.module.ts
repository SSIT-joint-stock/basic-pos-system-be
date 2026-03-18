import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { AuthModule } from 'app/module/auth/auth.module';
import { PrismaService } from 'app/prisma/prisma.service';
import { BcryptService } from 'app/common/helpers/bcrypt.util';
import { UsersModule } from 'app/module/users/users.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService, BcryptService],
})
export class AdminModule {}
