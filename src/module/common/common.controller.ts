import { Controller, Get } from '@nestjs/common';
import { CommonService } from './common.service';
import { bank } from 'app/common/types/bank.type';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('banks')
  async getBanks(): Promise<bank[]> {
    return this.commonService.getBanks();
  }
}
