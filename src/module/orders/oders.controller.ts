import express from 'express';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { order_status, payment_method } from '@prisma/client';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import type { IUser } from 'app/common/types/user.type';
import z from 'zod';
import { CreateOrderDto } from './dto/create-order';
import { OrdersExcelService } from './orders-excel.service';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly order: OrdersService,
    private readonly excel: OrdersExcelService,
  ) {}

  @Post()
  create(@User() user: IUser, @Body() dto: CreateOrderDto) {
    return this.order.create(user.storeId || '', dto, user);
  }

  @Delete()
  delete(@User() user: IUser, @Body() body: { orderId: string }) {
    return this.order.delete(body.orderId, user.storeId || '');
  }
  @Get(':orderId')
  findById(@User() user: IUser, @Param('orderId') orderId: string) {
    return this.order.findById(orderId, user.storeId || '');
  }

  @Get()
  async findAll(
    @User() user: IUser,
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
    const { data, total } = await this.order.findAll(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get('customer/:customerId')
  async findByCustomer(
    @User() user: IUser,
    @Param('customerId') customerId: string,
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
    const { data, total } = await this.order.getOrderByCustomer(
      customerId,
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  // Router for excel
  @Get('/excel/template')
  async downloadExampleOrder(@Res() res: express.Response) {
    const buffer = await this.excel.downloadExampleOrder();
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=category_template.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.end(buffer);
  }

  @Get('/excel/export')
  async exportExcelOrders(@Res() res: express.Response, @User() user: IUser) {
    const buffer = await this.excel.exportOrders(user.storeId || '');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }
}
