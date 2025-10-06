import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiSuccess } from 'app/common/decorators';
@Controller('stores/:storeId/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}
  @Get('revenue')
  @ApiSuccess('Revenue retrieved successfully')
  async getRevenue(
    @Param('storeId') storeId: string,
    @Query('type') type: 'day' | 'week' | 'month',
  ) {
    return this.statisticsService.getRevenue(storeId, type);
  }

  @Get('notifications')
  @ApiSuccess('Notifications retrieved successfully')
  async getNotifications(@Param('storeId') storeId: string) {
    return this.statisticsService.getNotifications(storeId);
  }
  @Get('revenue-by-category')
  @ApiSuccess('Notifications retrieved successfully')
  async getRevenueByCategory(
    @Param('storeId') storeId: string,
    @Query('type') type: 'day' | 'week' | 'month',
  ) {
    return this.statisticsService.getRevenueByCategory(storeId, type);
  }

  @Get('summary-revenue')
  @ApiSuccess('Notifications retrieved successfully')
  async summaryRevenue(
    @Param('storeId') storeId: string,
    @Query('type') type: 'day' | 'week' | 'month',
  ) {
    return this.statisticsService.summaryRevenue(storeId, type);
  }

  @Get('top-products')
  @ApiSuccess('Notifications retrieved successfully')
  async getTopProducts(@Param('storeId') storeId: string) {
    return this.statisticsService.getTopProducts(storeId);
  }

  @Get('low-stock-product')
  @ApiSuccess('Notifications retrieved successfully')
  async getLowStockProduct(@Param('storeId') storeId: string) {
    return this.statisticsService.getLowStockProduct(storeId);
  }
}
