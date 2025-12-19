import { Module } from '@nestjs/common';
import { StoreRewardPointService } from './store-reward-point.service';
import { StoreRewardPointController } from './store-reward-point.controller';

@Module({
  controllers: [StoreRewardPointController],
  providers: [StoreRewardPointService],
})
export class StoreRewardPointModule {}
