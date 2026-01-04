import { Module } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { ExportReportService } from 'app/module/report/export-report.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  controllers: [ReportController],
  providers: [
    ReportService,
    PrismaService,
    ExportReportService,
    Format,
    FormatStatus,
    ExcelTemplateService,
  ],
})
export class ReportModule {}
