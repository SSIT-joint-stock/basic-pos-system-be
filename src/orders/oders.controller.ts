/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order';
import { User } from 'app/common/decorators/user.decorator';
import type { IUSER } from 'app/auth/token.service';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import z from 'zod';
import { order_status, payment_method } from '@prisma/client';
import { PaginatedResponse } from 'app/common/response';

@Controller('store/:storeId/orders')
export class OrdersController {
  constructor(private readonly order: OrdersService) {}

  @Post()
  create(
    @Param('storeId') storeId: string,
    @Body() dto: CreateOrderDto,
    @User() user: IUSER,
  ) {
    return this.order.create(storeId, dto, user);
  }

  @Delete()
  delete(@Param('storeId') storeId: string, @Body() body: { orderId: string }) {
    return this.order.delete(body.orderId, storeId);
  }

  @Get()
  async findAll(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'total_amount'],
      schema: z.object({
        status: z.enum(order_status).optional(),
        payment_method: z.enum(payment_method).optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query,
  ) {
    const { data, total } = await this.order.findAll(query.prismaQuery);
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }
}
