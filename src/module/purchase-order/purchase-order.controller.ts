import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/purchase-order.dto';
import { User } from 'app/common/decorators/user.decorator';
import type { IUser } from 'app/common/types/user.type';
import { ApiSuccess } from 'app/common/decorators';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { AcceptPaymentImportPurchaseDto } from './dto/accept-payment-puchase.dto';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import z from 'zod';
import { payment_status, purchase_order_status } from '@prisma/client';
import { PaginatedResponse } from 'app/common/response';
import { PurchasePaymentService } from './purchase-payment.service';

@Controller('purchase-order')
export class PurchaseOrderController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly purchasePaymentService: PurchasePaymentService,
  ) {}
  // @Post(':storeId')
  // @ApiSuccess('Tạo đơn nhập hàng thành công!')
  // @RequirePermission([PERMISSIONS.PURCHASE_ORDER_CREATE])
  // async createPurchaseOrder(
  //   @Param('storeId') storeId: string,
  //   @Body() dto: CreatePurchaseOrderDto,
  //   @User() user: IUser,
  // ) {
  //   return await this.purchaseOrderService.createPurchaseOrder(
  //     storeId,
  //     dto,
  //     user,
  //   );
  // }

  @Post(':storeId/accept-payment/:id')
  @ApiSuccess('Xác nhận thanh toán đơn hàng thành công!')
  @RequirePermission([PERMISSIONS.PURCHASE_ORDER_UPDATE])
  async acceptPayment(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: AcceptPaymentImportPurchaseDto,
  ) {
    return await this.purchasePaymentService.acceptPayment(storeId, id, dto);
  }

  @Post(':storeId/accept-import/:id')
  @ApiSuccess('Xác nhận nhập kho thành công!')
  @RequirePermission([PERMISSIONS.PURCHASE_ORDER_UPDATE])
  async acceptImport(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    return await this.purchaseOrderService.acceptPurchaseImport(id, storeId);
  }

  @Get(':storeId')
  @ApiSuccess('Lấy toàn bộ đơn nhập hàng thành công!')
  @RequirePermission([
    PERMISSIONS.PURCHASE_ORDER_READ,
    PERMISSIONS.PURCHASE_ORDER_ALL,
  ])
  async getPurchaseOrders(
    @Param('storeId') storeId: string,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: [
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total',
        'shipping_fee',
      ],
      rangeFields: ['total', 'subtotal'],
      searchBy: ['order_number', 'supplier_code'],
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
        status: z.enum(purchase_order_status).optional(),
      }),
    })
    query: FilterParseResult<any>,
  ) {
    const { data, total } = await this.purchaseOrderService.getPurchaseOrders(
      storeId,
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get(':storeId/payment-history/')
  @ApiSuccess('Lấy lịch sử dụng thanh toán!')
  @RequirePermission([PERMISSIONS.PURCHASE_ORDER_READ])
  async getPaymentHistory(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      searchKey: 'q',
      schema: z.object({}),
    })
    query: FilterParseResult<any>,
    @Param('storeId') storeId: string,
  ) {
    const { data, total } = await this.purchasePaymentService.getPaymentHistory(
      query.prismaQuery,
      storeId,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }
}
