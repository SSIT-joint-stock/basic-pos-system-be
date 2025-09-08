import { Controller, Get, Body, Param, Query } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';

@Controller('stock-movement')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Get()
  findAllByStoreId(
    @Query('store_id') store_id: string,
    @Body() data: { userId: string }, //FIX: fix this later
  ) {
    const userId = data.userId;
    return this.stockMovementService.findAllByStoreId(userId, store_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockMovementService.findOne(id);
  }
}
