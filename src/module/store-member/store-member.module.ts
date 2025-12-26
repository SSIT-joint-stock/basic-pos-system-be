import { Module } from '@nestjs/common';
import { StoreMemberController } from './store-member.controller';
import { StoreMemberService } from './store-member.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { BcryptService } from 'app/common/helpers/bcrypt.util';

@Module({
  controllers: [StoreMemberController],
  providers: [StoreMemberService, PrismaService, BcryptService],
  exports: [StoreMemberService],
})
export class StoreMemberModule {}
