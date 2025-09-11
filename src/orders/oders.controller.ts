/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order';
import { User } from 'app/common/decorators/user.decorator';
import type { IUSER } from 'app/auth/token.service';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import z from 'zod';
import { order_status, payment_method } from '@prisma/client';
import { PaginatedResponse } from 'app/common/response';

@Controller('orders')
export class OrdersController {
  constructor(private readonly order: OrdersService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateOrderDto, @User() user: IUSER) {
    return this.order.create(req.user.id, dto, user);
  }

  @Get()
  async findAll(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'total_amount'],
      schema: z.object({
        status: z.enum(order_status).optional(),
        payment_method: z.enum(payment_method).optional(),
      }),
    })
    query,
  ) {
    const { data, total } = await this.order.findAll(query.prismaQuery);
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }
}
