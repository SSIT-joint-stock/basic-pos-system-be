import { Module } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, PrismaService],
})
export class ReportModule {}
