import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiSuccess } from 'app/common/decorators';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { type IUser } from 'app/common/types/user.type';
import { PurchaseReturnDto } from 'app/module/purchase-return/dto/purchase-return.dto';
import { PurchaseReturnService } from './purchase-return.service';

@Controller('purchase-return')
export class PurchaseReturnController {
  constructor(private readonly purchaseReturnService: PurchaseReturnService) {}

  @RequirePermission([
    PERMISSIONS.PURCHASE_RETURN_CREATE,
    PERMISSIONS.PURCHASE_RETURN_ALL,
  ])
  @ApiSuccess('Tạo đơn trả hàng nhập thành công!')
  @Post(':purchaseOrderId')
  createWithPurchaseOrder(
    @User() user: IUser,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() dto: PurchaseReturnDto,
  ) {
    return this.purchaseReturnService.createWithPurchaseOrder(
      purchaseOrderId,
      dto,
      user.storeId || '',
      user,
    );
  }
}
