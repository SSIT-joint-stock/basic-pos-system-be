import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationAdminController } from './notification-admin.controller';
import { PrismaService } from 'app/prisma/prisma.service';

@Module({
  controllers: [NotificationController, NotificationAdminController],
  providers: [NotificationService, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}
