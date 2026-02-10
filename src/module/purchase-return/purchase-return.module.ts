import { Module } from '@nestjs/common';
import { FinanceModule } from 'app/module/finance/finance.module';
import { PurchaseOrderModule } from 'app/module/purchase-order/purchase-order.module';
import { PurchaseReturnPaymentService } from 'app/module/purchase-return/purchase-return-payment.service';
import { GeneratePurchaseReturnNumberUseCase } from 'app/module/purchase-return/usecase/generate-return-number.use.case';
import { StockMovementModule } from 'app/module/stock-movement/stock-movement.module';
import { ApplyStockUseCase } from 'app/module/variant/use-case/apply-stock.usecase';
import { PurchaseReturnController } from './purchase-return.controller';
import { PurchaseReturnService } from './purchase-return.service';

@Module({
  controllers: [PurchaseReturnController],
  providers: [
    PurchaseReturnService,
    PurchaseReturnPaymentService,
    ApplyStockUseCase,
    GeneratePurchaseReturnNumberUseCase,
  ],
  imports: [PurchaseOrderModule, StockMovementModule, FinanceModule],
})
export class PurchaseReturnModule {}
