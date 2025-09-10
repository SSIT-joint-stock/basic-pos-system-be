import { Module } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { StockMovementController } from './stock-movement.controller';
import { PermissionService } from 'app/permissions/permission.service';

@Module({
  controllers: [StockMovementController],
  providers: [StockMovementService, PermissionService],
  exports: [StockMovementService],
})
export class StockMovementModule {}
