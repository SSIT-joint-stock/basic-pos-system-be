import { Controller } from '@nestjs/common';
import { StoreRewardPointService } from './store-reward-point.service';

@Controller('store-reward-point')
export class StoreRewardPointController {
  constructor(
    private readonly storeRewardPointService: StoreRewardPointService,
  ) {}
}
