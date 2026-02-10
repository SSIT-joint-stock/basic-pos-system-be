import { Module } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { FinanceModule } from 'app/module/finance/finance.module';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { PurchasePriceUseCase } from 'app/shared/usecase/purchase-price.usecase';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { ApplyStockUseCase } from '../variant/use-case/apply-stock.usecase';
import { PurchaseOrderExcelService } from './purchase-order-excel.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchasePaymentService } from './purchase-payment.service';
import { GeneratePurchaseCodeUseCase } from './use-case/genereate-order-number.usecase';

@Module({
  controllers: [PurchaseOrderController],
  providers: [
    PurchaseOrderService,
    GeneratePurchaseCodeUseCase,
    PurchasePaymentService,
    ApplyStockUseCase,
    ExcelTemplateService,
    PurchaseOrderExcelService,
    PurchasePriceUseCase,
    Format,
    FormatStatus,
  ],
  imports: [StockMovementModule, FinanceModule],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
