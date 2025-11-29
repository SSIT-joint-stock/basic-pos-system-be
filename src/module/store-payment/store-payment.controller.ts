import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { StorePaymentService } from './store-payment.service';
import { ApiSuccess } from 'app/common/decorators';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { CreateStorePaymentDto } from './dto/create-store-payment.dto';

@Controller('store-payment')
export class StorePaymentController {
  constructor(private readonly storePaymentService: StorePaymentService) {}

  @Post(':storeId')
  @ApiSuccess('Tạo thông tin thanh toán thành công!')
  @RequirePermission([PERMISSIONS.PAYMENT_STORE_CREATE])
  async createPaymentInfo(
    @Body() dto: CreateStorePaymentDto,
    @Param('storeId') storeId: string,
  ) {
    return this.storePaymentService.createPaymentInfo(dto, storeId);
  }

  @Patch(':storeId')
  @ApiSuccess('Cập nhật thông tin thanh toán thành công!')
  @RequirePermission([PERMISSIONS.PAYMENT_STORE_UPDATE])
  async updatePaymentInfo(
    @Body() dto: CreateStorePaymentDto,
    @Param('storeId') storeId: string,
  ) {
    return this.storePaymentService.updatePaymentInfo(dto, storeId);
  }

  @Get(':storeId')
  @RequirePermission([PERMISSIONS.PAYMENT_STORE_ALL])
  async getPaymentInfo(@Param('storeId') storeId: string) {
    return this.storePaymentService.getPaymentInfo(storeId);
  }
}
