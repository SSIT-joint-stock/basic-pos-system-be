import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StorePaymentService } from './store-payment.service';
import { ApiSuccess } from 'app/common/decorators';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { ConfigPaymentInfo } from './dto/config-payment-info';

@Controller('store-payment')
export class StorePaymentController {
  constructor(private readonly storePaymentService: StorePaymentService) {}

  @Post(':storeId')
  @ApiSuccess('Cấu hình thông tin thanh toán thành công!')
  @RequirePermission([PERMISSIONS.PAYMENT_STORE_CREATE])
  async configPaymentInfo(
    @Body() dto: ConfigPaymentInfo,
    @Param('storeId') storeId: string,
  ) {
    return this.storePaymentService.configPaymentStore(dto, storeId);
  }

  @Get(':storeId')
  @RequirePermission([PERMISSIONS.PAYMENT_STORE_ALL])
  async getPaymentInfo(@Param('storeId') storeId: string) {
    return this.storePaymentService.getPaymentInfo(storeId);
  }
}
