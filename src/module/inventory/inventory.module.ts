import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { StockMovementModule } from '../stock-movement/stock-movement.module';

@Module({
  imports: [StockMovementModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
