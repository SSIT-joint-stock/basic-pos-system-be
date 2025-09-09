import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { PrismaService } from 'app/prisma/prisma.service';
import { PermissionService } from 'app/permissions/permission.service';

@Module({
  controllers: [StoreController],
  providers: [StoreService, PrismaService, PermissionService],
})
export class StoreModule {}
