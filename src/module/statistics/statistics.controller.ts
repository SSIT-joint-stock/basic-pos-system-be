import { Controller, Get, Body, Param, Query } from '@nestjs/common';
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
}
