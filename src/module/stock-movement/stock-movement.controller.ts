import { Controller, Get, Body, Param, UseGuards } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';
import { ApiSuccess } from 'app/common/decorators';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';

@Controller('stores/:storeId/stock-movement')
@UseGuards(PermissionGuard)
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Get()
  @RequirePermissions([PERMISSIONS.STOCK_MOVEMENT_READ, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Find all stock movement successfully')
  findAll(@Param('storeId') storeId: string) {
    return this.stockMovementService.findAll(storeId);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.STOCK_MOVEMENT_READ, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Find stock movement by Id successfully')
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.stockMovementService.findOne(storeId, id);
  }
}
