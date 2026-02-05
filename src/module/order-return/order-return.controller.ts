import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { order_return_status, order_return_type } from '@prisma/client';
import { ApiSuccess } from 'app/common/decorators';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUser } from 'app/common/types/user.type';
import { AcceptPaymentReturn } from 'app/module/order-return/dto/accept-payment-return.dto';
import { AcceptQuantityReturnDto } from 'app/module/order-return/dto/accept-quantity-return.dto';
import { OrderReturnDto } from 'app/module/order-return/dto/order-return.dto';
import z from 'zod';
import { OrderReturnService } from './order-return.service';

@Controller('order-return')
export class OrderReturnController {
  constructor(private readonly orderReturnService: OrderReturnService) {}

  @Post(':orderId')
  @ApiSuccess('Tạo đơn trả hàng thành công!')
  @RequirePermissions([
    PERMISSIONS.ORDER_RETURN_CREATE,
    PERMISSIONS.ORDER_RETURN_ALL,
  ])
  async createOrderReturn(
    @Param('orderId') orderId: string,
    @User() user: IUser,
    @Body() dto: OrderReturnDto,
  ) {
    return await this.orderReturnService.createOrderReturn(
      orderId,
      user.storeId || '',
      user,
      dto,
    );
  }

  @Post('accept-payment/:id')
  @ApiSuccess('Đơn hàng thanh toàn thành công')
  @RequirePermissions([
    PERMISSIONS.ORDER_RETURN_UPDATE,
    PERMISSIONS.ORDER_RETURN_ALL,
  ])
  async acceptPaymentReturn(
    @Param('id') id: string,
    @User() user: IUser,
    @Body() dto: AcceptPaymentReturn,
  ) {
    return await this.orderReturnService.acceptPaymentReturn(
      id,
      user.storeId || '',
      dto,
    );
  }

  @Patch('accept-stock/:id')
  @ApiSuccess('Nhập kho đơn trả hàng thành công')
  @RequirePermissions([
    PERMISSIONS.ORDER_RETURN_UPDATE,
    PERMISSIONS.ORDER_RETURN_ALL,
  ])
  async acceptStockReturn(
    @Param('id') id: string,
    @User() user: IUser,
    @Body() dto: AcceptQuantityReturnDto,
  ) {
    return await this.orderReturnService.acceptReturnQuantity(
      id,
      user.storeId || '',
      dto,
    );
  }

  @Patch('cancel-return/:id')
  @ApiSuccess('Hủy đơn trả hàng thành công!')
  @RequirePermissions([
    PERMISSIONS.ORDER_RETURN_UPDATE,
    PERMISSIONS.ORDER_RETURN_ALL,
  ])
  async cancelOrderReturn(@Param('id') id: string, @User() user: IUser) {
    return await this.orderReturnService.cancelOrderReturn(
      id,
      user.storeId || '',
    );
  }

  @Get('')
  @RequirePermissions([
    PERMISSIONS.ORDER_RETURN_READ,
    PERMISSIONS.ORDER_RETURN_ALL,
  ])
  async getAll(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt'],
      rangeFields: ['total', 'subtotal'],
      searchBy: [
        'order_number',
        'order_return_number',
        'customer_name',
        'customer_phone',
      ],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
        return_type: z.enum(order_return_type).optional(),
        return_status: z.enum(order_return_status).optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() { storeId }: IUser,
  ) {
    const { data, total } = await this.orderReturnService.getOrderReturns(
      storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get(':id')
  @RequirePermissions([
    PERMISSIONS.ORDER_RETURN_READ,
    PERMISSIONS.ORDER_RETURN_ALL,
  ])
  async getOrderReturn(@Param('id') id: string, @User() user: IUser) {
    return await this.orderReturnService.getOrderReturn(id, user.storeId || '');
  }
}
