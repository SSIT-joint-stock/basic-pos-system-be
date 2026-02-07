import { Module } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { ReportCustomerService } from 'app/module/report/customer/report-customer.service';
import { ExportReportService } from 'app/module/report/export-report.service';
import { ReportSalesService } from 'app/module/report/sales/report-sales.service';
import { ReportSupplierService } from 'app/module/report/supplier/report-supplier.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { ReportController } from './report.controller';

@Module({
  controllers: [ReportController],
  providers: [
    PrismaService,
    ReportCustomerService,
    ReportSupplierService,
    ReportSalesService,
    ExportReportService,
    Format,
    FormatStatus,
    ExcelTemplateService,
  ],
})
export class ReportModule {}
