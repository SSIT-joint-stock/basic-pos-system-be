import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { PermissionService } from 'app/permissions/permission.service';

@Module({
  imports: [StockMovementModule],
  controllers: [InventoryController],
  providers: [InventoryService, PermissionService],
})
export class InventoryModule {}
