import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { OrdersController } from './oders.controller';
import { StockMovementModule } from 'app/module/stock-movement/stock-movement.module';
import { InventoryModule } from 'app/module/inventory/inventory.module';

@Module({
  imports: [StockMovementModule, InventoryModule],
  providers: [OrdersService, PrismaService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
