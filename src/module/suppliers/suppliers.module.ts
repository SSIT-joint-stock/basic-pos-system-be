import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { GenerateCodeSupplier } from './use-case/generate-supplier-code.usecase';
import { ImportSupplierService } from './suppliers-excel.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';

@Module({
  controllers: [SuppliersController],
  providers: [
    SuppliersService,
    ImportSupplierService,
    GenerateCodeSupplier,
    PrismaService,
    ExcelTemplateService,
  ],
})
export class SuppliersModule {}
