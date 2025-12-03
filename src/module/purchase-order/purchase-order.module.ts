import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { GeneratePurchaseCodeUseCase } from './use-case/genereate-order-number.usecase';
import { PurchasePaymentService } from './purchase-payment.service';

@Module({
  controllers: [PurchaseOrderController],
  providers: [
    PurchaseOrderService,
    GeneratePurchaseCodeUseCase,
    PurchasePaymentService,
  ],
  imports: [InventoryModule, StockMovementModule],
})
export class PurchaseOrderModule {}
