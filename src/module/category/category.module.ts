import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'app/prisma/prisma.service';
import { PermissionService } from 'app/permissions/permission.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService, PermissionService],
})
export class CategoryModule {}
