import { Module } from '@nestjs/common';
import { FinanceModule } from 'app/module/finance/finance.module';
import { GenerateReturnOrderUseCase } from 'app/module/order-return/use-case/generate-return-num.usecase';
import { StockMovementModule } from 'app/module/stock-movement/stock-movement.module';
import { ApplyStockUseCase } from 'app/module/variant/use-case/apply-stock.usecase';
import { PrismaService } from 'app/prisma/prisma.service';
import { PricingService } from 'app/shared/usecase/order-price.usecase';
import { OrderReturnController } from './order-return.controller';
import { OrderReturnService } from './order-return.service';

@Module({
  controllers: [OrderReturnController],
  imports: [StockMovementModule, FinanceModule],
  providers: [
    OrderReturnService,
    PrismaService,
    GenerateReturnOrderUseCase,
    PricingService,
    ApplyStockUseCase,
  ],
})
export class OrderReturnModule {}
