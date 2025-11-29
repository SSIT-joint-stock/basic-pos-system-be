import { Body, Controller, Param, Post } from '@nestjs/common';
import { StoreRewardPointService } from './store-reward-point.service';
import { ApiSuccess } from 'app/common/decorators';
import { ApplyRewardPointDto } from './dto/apply-reward-point.dto';

@Controller('store-reward-point')
export class StoreRewardPointController {
  constructor(
    private readonly storeRewardPointService: StoreRewardPointService,
  ) {}
  @ApiSuccess('Cấu hình điểm quy đổi thành công')
  @Post('apply/:storeId')
  async configRewardPoint(
    @Param('storeId') storeId: string,
    @Body() dto: ApplyRewardPointDto,
  ) {
    return await this.storeRewardPointService.configRewardPoint(storeId, dto);
  }
}
