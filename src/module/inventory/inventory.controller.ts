import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiResponse } from 'app/common/response';
import { AdjustInventoryDto } from './dto/adjust-quantity.dto';
import { SetStatusDto } from './dto/set-status.dto';
import { RevalueInventoryDto } from './dto/revalue.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Put()
  async adjustQuanity(@Body() adjustInventoryDto: AdjustInventoryDto) {
    const { userId, product_id, delta } = adjustInventoryDto;
    const result = await this.inventoryService.adjustQuanity(
      userId,
      product_id,
      delta,
    );
    return ApiResponse.success(result, 'Adjust quantity successfully');
  }

  @Get()
  async findAll(@Query('store_id') store_id: string) {
    const result = await this.inventoryService.findAll(store_id);
    return ApiResponse.success(result, 'Find all inventory successfully');
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const result = await this.inventoryService.findById(id);
    return ApiResponse.success(result, 'Find invetory by Id successfully');
  }

  @Patch('status/:id')
  async setStatus(@Param('id') id: string, @Body() dto: SetStatusDto) {
    const { userId, status } = dto;
    const result = await this.inventoryService.setSatus(userId, id, status);
    return ApiResponse.success(result, 'Set status successfully');
  }

  @Patch('revalue/:id')
  async revalue(@Param('id') id: string, @Body() dto: RevalueInventoryDto) {
    const { userId, ...payload } = dto;
    const result = await this.inventoryService.revalue(userId, id, payload);
    return ApiResponse.success(result, 'Revalue successfully');
  }
}
