import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { GeneratePurchaseCodeUseCase } from './use-case/genereate-order-number.usecase';
import { PurchasePaymentService } from './purchase-payment.service';
import { ApplyStockUseCase } from '../variant/use-case/apply-stock.usecase';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { PurchaseOrderExcelService } from './purchase-order-excel.service';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';

@Module({
  controllers: [PurchaseOrderController],
  providers: [
    PurchaseOrderService,
    GeneratePurchaseCodeUseCase,
    PurchasePaymentService,
    ApplyStockUseCase,
    ExcelTemplateService,
    PurchaseOrderExcelService,
    Format,
    FormatStatus,
  ],
  imports: [StockMovementModule],
})
export class PurchaseOrderModule {}
