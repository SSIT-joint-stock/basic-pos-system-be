import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'app/prisma/prisma.module';
import { UserAdminController } from './user-admin.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController, UserAdminController],
  imports: [PrismaModule],
  exports: [UsersService],
})
export class UsersModule {}
