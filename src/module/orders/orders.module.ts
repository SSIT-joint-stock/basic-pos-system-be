import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { OrdersController } from './oders.controller';
import { StockMovementModule } from 'app/module/stock-movement/stock-movement.module';
import { GenerateOrderCodeUseCase } from './use-case/generate-order-code.usecase';
import { ApplyStockUseCase } from '../variant/use-case/apply-stock.usecase';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { OrdersExcelService } from './orders-excel.service';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';

@Module({
  imports: [StockMovementModule],
  providers: [
    OrdersService,
    PrismaService,
    GenerateOrderCodeUseCase,
    ApplyStockUseCase,
    ExcelTemplateService,
    OrdersExcelService,
    Format,
    FormatStatus,
  ],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
