import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-quantity.dto';
import { SetStatusDto } from './dto/set-status.dto';
import { RevalueInventoryDto } from './dto/revalue.dto';
import { ApiSuccess } from 'app/common/decorators';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';

@Controller('stores/:storeId/inventories')
@UseGuards(PermissionGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Put(':id')
  @RequirePermissions([PERMISSIONS.INVENTORY_ADJUST, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Adjust quantity successfully')
  async adjustQuanity(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() adjustInventoryDto: AdjustInventoryDto,
  ) {
    const { delta } = adjustInventoryDto;
    return this.inventoryService.adjustQuanity(storeId, id, delta);
  }

  @Get()
  @RequirePermissions([PERMISSIONS.INVENTORY_READ, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Find all inventory successfully')
  async findAll(@Param('storeId') store_id: string) {
    return this.inventoryService.findAll(store_id);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.INVENTORY_READ, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Find invetory by Id successfully')
  async findById(@Param('storeId') store_id: string, @Param('id') id: string) {
    return this.inventoryService.findById(store_id, id);
  }

  @Put('status/:id')
  @RequirePermissions([PERMISSIONS.INVENTORY_ADJUST, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Set status successfully')
  async setStatus(
    @Param('storeId') store_id: string,
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    const { status } = dto;
    return this.inventoryService.setStatus(store_id, id, status);
  }

  @Patch('revalue/:id')
  @RequirePermissions([PERMISSIONS.INVENTORY_ADJUST, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Revalue successfully')
  async revalue(
    @Param('storeId') store_id: string,
    @Param('id') id: string,
    @Body() dto: RevalueInventoryDto,
  ) {
    return this.inventoryService.revalue(store_id, id, dto);
  }
}
