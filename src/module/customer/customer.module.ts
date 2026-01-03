import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { ImportCustomerService } from './customer-excel.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { ImportExcelModule } from 'app/shared/import-excel/import.module';
@Module({
  imports: [ImportExcelModule],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    ImportCustomerService,
    PrismaService,
    ExcelTemplateService,
  ],
})
export class CustomerModule {}
