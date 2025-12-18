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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order';
import { User } from 'app/common/decorators/user.decorator';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import z from 'zod';
import { order_status, payment_method } from '@prisma/client';
import { PaginatedResponse } from 'app/common/response';
import type { IUser } from 'app/common/types/user.type';
import { OrdersExcelService } from './orders-excel.service';

@Controller('stores/:storeId/orders')
export class OrdersController {
  constructor(
    private readonly order: OrdersService,
    private readonly excel: OrdersExcelService,
  ) {}

  @Post()
  create(
    @Param('storeId') storeId: string,
    @Body() dto: CreateOrderDto,
    @User() user: IUser,
  ) {
    return this.order.create(storeId, dto, user);
  }

  @Delete()
  delete(@Param('storeId') storeId: string, @Body() body: { orderId: string }) {
    return this.order.delete(body.orderId, storeId);
  }
  @Get(':orderId')
  findById(
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.order.findById(orderId, storeId);
  }

  @Get()
  async findAll(
    @Param('storeId') store_id: string,
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
      store_id,
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
  async exportExcelOrders(
    @Res() res: express.Response,
    @Param('storeId') storeId: string,
  ) {
    const buffer = await this.excel.exportOrders(storeId);
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }
}
