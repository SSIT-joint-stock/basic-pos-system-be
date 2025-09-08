import { Module } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { StockMovementController } from './stock-movement.controller';

@Module({
  controllers: [StockMovementController],
  providers: [StockMovementService],
  exports: [StockMovementService],
})
export class StockMovementModule {}
