import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { payment_status, purchase_return_status } from '@prisma/client';
import { ApiSuccess } from 'app/common/decorators';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { type IUser } from 'app/common/types/user.type';
import { AcceptPaymentPurchaseReturnDto } from 'app/module/purchase-return/dto/accept-paymen-purchase-return.dto';
import {
  PurchaseReturnWithPODto,
  PurchaseReturnWithoutPODto,
} from 'app/module/purchase-return/dto/purchase-return.dto';
import { PurchaseReturnPaymentService } from 'app/module/purchase-return/purchase-return-payment.service';
import z from 'zod';
import { PurchaseReturnService } from './purchase-return.service';

@Controller('purchase-return')
export class PurchaseReturnController {
  constructor(
    private readonly purchaseReturnService: PurchaseReturnService,
    private readonly purchaseReturnPaymentService: PurchaseReturnPaymentService,
  ) {}

  @RequirePermission([
    PERMISSIONS.PURCHASE_RETURN_CREATE,
    PERMISSIONS.PURCHASE_RETURN_ALL,
  ])
  @ApiSuccess('Tạo đơn trả hàng nhập thành công!')
  @Post('order/:purchaseOrderId')
  createWithPurchaseOrder(
    @User() user: IUser,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() dto: PurchaseReturnWithPODto,
  ) {
    return this.purchaseReturnService.createWithPurchaseOrder(
      purchaseOrderId,
      dto,
      user.storeId || '',
      user,
    );
  }

  @RequirePermission([
    PERMISSIONS.PURCHASE_RETURN_CREATE,
    PERMISSIONS.PURCHASE_RETURN_ALL,
  ])
  @ApiSuccess('Tạo đơn trả hàng thành công!')
  @Post('/free')
  createWithoutPurchaseOrder(
    @User() user: IUser,
    @Body() dto: PurchaseReturnWithoutPODto,
  ) {
    return this.purchaseReturnService.createWithoutPurchaseOrder(
      user.storeId || '',
      dto,
      user,
    );
  }

  @RequirePermission([
    PERMISSIONS.PURCHASE_RETURN_ACCEPT_PAYMENT,
    PERMISSIONS.PURCHASE_RETURN_ALL,
  ])
  @ApiSuccess('Xác nhận hoàn tiền đơn trả hàng thành công!')
  @Put('accept-payment/:id')
  acceptPayment(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() dto: AcceptPaymentPurchaseReturnDto,
  ) {
    return this.purchaseReturnPaymentService.acceptPaymentPurchaseReturn(
      user.storeId || '',
      id,
      dto,
    );
  }

  @RequirePermission([
    PERMISSIONS.PURCHASE_RETURN_READ,
    PERMISSIONS.PURCHASE_RETURN_ALL,
  ])
  @Get('')
  async getAll(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt'],
      rangeFields: ['total', 'subtotal'],
      searchBy: ['return_number', 'supplier_code', 'supplier_name'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(), // ⬅️ thêm q vào schema
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
        payment_status: z.enum(payment_status).optional(),
        status: z.enum(purchase_return_status).optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() { storeId }: IUser,
  ) {
    const { data, total } =
      await this.purchaseReturnService.getAllPurchaseReturn(
        storeId || '',
        query.prismaQuery,
      );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @RequirePermission([
    PERMISSIONS.PURCHASE_RETURN_READ,
    PERMISSIONS.PURCHASE_RETURN_ALL,
  ])
  @Get(':purchaseReturnId')
  getDetail(
    @Param('purchaseReturnId') purchaseReturnId: string,
    @User() user: IUser,
  ) {
    return this.purchaseReturnService.getPurchaseReturn(
      user.storeId || '',
      purchaseReturnId,
    );
  }
}
