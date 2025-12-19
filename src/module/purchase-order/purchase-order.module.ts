import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { GeneratePurchaseCodeUseCase } from './use-case/genereate-order-number.usecase';
import { PurchasePaymentService } from './purchase-payment.service';
import { ApplyStockUseCase } from '../variant/use-case/apply-stock.usecase';
import { StockMovementModule } from '../stock-movement/stock-movement.module';

@Module({
  controllers: [PurchaseOrderController],
  providers: [
    PurchaseOrderService,
    GeneratePurchaseCodeUseCase,
    PurchasePaymentService,
    ApplyStockUseCase,
  ],
  imports: [StockMovementModule],
})
export class PurchaseOrderModule {}
