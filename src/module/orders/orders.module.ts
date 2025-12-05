import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { OrdersController } from './oders.controller';
import { StockMovementModule } from 'app/module/stock-movement/stock-movement.module';
import { GenerateOrderCodeUseCase } from './use-case/generate-order-code.usecase';

@Module({
  imports: [StockMovementModule],
  providers: [OrdersService, PrismaService, GenerateOrderCodeUseCase],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
