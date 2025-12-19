import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'app/prisma/prisma.service';
import { PermissionService } from 'app/permissions/permission.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { ImportCategoryService } from './category-excel.service';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryService,
    PrismaService,
    PermissionService,
    ImportCategoryService,
    ExcelTemplateService,
  ],
})
export class CategoryModule {}
