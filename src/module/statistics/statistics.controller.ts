import { Controller, Get, Query } from '@nestjs/common';
import { ApiSuccess } from 'app/common/decorators';
import { User } from 'app/common/decorators/user.decorator';
import { type IUser } from 'app/common/types/user.type';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('revenue')
  @ApiSuccess('Revenue retrieved successfully')
  async getRevenue(
    @User() user: IUser,
    @Query('type') type: 'day' | 'week' | 'month',
  ) {
    return this.statisticsService.getRevenue(user.storeId || '', type);
  }

  @Get('notifications')
  @ApiSuccess('Notifications retrieved successfully')
  async getNotifications(
    @User() user: IUser,
    @Query('type') type: 'all' | 'order' | 'stock',
    @Query('limit') limit: number = 5,
  ) {
    return this.statisticsService.getNotifications(
      user.storeId || '',
      type,
      limit,
    );
  }
  @Get('revenue-by-category')
  @ApiSuccess('Notifications retrieved successfully')
  async getRevenueByCategory(
    @User() user: IUser,
    @Query('type') type: 'day' | 'week' | 'month',
  ) {
    return this.statisticsService.getRevenueByCategory(
      user.storeId || '',
      type,
    );
  }

  @Get('summary-revenue')
  @ApiSuccess('Notifications retrieved successfully')
  async summaryRevenue(
    @User() user: IUser,
    @Query('type') type: 'day' | 'week' | 'month',
  ) {
    return this.statisticsService.summaryRevenue(user.storeId || '', type);
  }

  @Get('top-products')
  @ApiSuccess('Notifications retrieved successfully')
  async getTopProducts(@User() user: IUser) {
    return this.statisticsService.getTopProducts(user.storeId || '');
  }

  @Get('low-stock-product')
  @ApiSuccess('Notifications retrieved successfully')
  async getLowStockProduct(@User() user: IUser) {
    return this.statisticsService.getLowStockProduct(user.storeId || '');
  }
}
