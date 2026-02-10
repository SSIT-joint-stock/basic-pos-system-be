import { Module } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { FinanceModule } from 'app/module/finance/finance.module';
import { StockMovementModule } from 'app/module/stock-movement/stock-movement.module';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { PricingService } from 'app/shared/usecase/order-price.usecase';
import { ApplyStockUseCase } from '../variant/use-case/apply-stock.usecase';
import { OrdersController } from './oders.controller';
import { OrdersExcelService } from './orders-excel.service';
import { OrdersService } from './orders.service';
import { GenerateOrderCodeUseCase } from './use-case/generate-order-code.usecase';

@Module({
  imports: [StockMovementModule, FinanceModule],
  providers: [
    OrdersService,
    PrismaService,
    GenerateOrderCodeUseCase,
    ApplyStockUseCase,
    ExcelTemplateService,
    OrdersExcelService,
    Format,
    FormatStatus,
    PricingService,
  ],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
