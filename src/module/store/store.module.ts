import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { PrismaService } from 'app/prisma/prisma.service';
import { PermissionService } from 'app/permissions/permission.service';
import { StoreAdminController } from './store-admin.controller';

@Module({
  controllers: [StoreController, StoreAdminController],
  providers: [StoreService, PrismaService, PermissionService],
  exports: [StoreService],
})
export class StoreModule {}
