import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { PrismaModule } from 'app/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class SharedModule {}
