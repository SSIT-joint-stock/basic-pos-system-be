import { Module } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { ReportCustomerService } from 'app/module/report/customer/report-customer.service';
import { ExportReportService } from 'app/module/report/export-report.service';
import { ReportOrderItemService } from 'app/module/report/order-item/report-order-item.service';
import { ReportPurchaseService } from 'app/module/report/purchase/report-purchase.service';
import { ReportOrderReturnService } from 'app/module/report/return/report-order-return.service';
import { ReportStockLedgerService } from 'app/module/report/stock-ledger/report-stock-ledger.service';
import { ReportStockService } from 'app/module/report/stock/report-stock.service';
import { ReportStoreMemberService } from 'app/module/report/store-member/store-member-reprot.service';
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
    ReportOrderItemService,
    ReportStoreMemberService,
    ReportStockService,
    ReportStockLedgerService,
    ReportPurchaseService,
    ReportOrderReturnService,
    ExportReportService,
    Format,
    FormatStatus,
    ExcelTemplateService,
  ],
})
export class ReportModule {}
