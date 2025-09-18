/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Body, Param, UseGuards } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';
import { ApiSuccess } from 'app/common/decorators';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import z from 'zod';
import { PaginatedResponse } from 'app/common/response';
import { stock_movement_type } from '@prisma/client';

@Controller('stores/:storeId/stock-movement')
@UseGuards(PermissionGuard)
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Get()
  @RequirePermissions([PERMISSIONS.STOCK_MOVEMENT_READ, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Find all stock movement successfully')
  async findAll(
    @Param('storeId') storeId: string,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'total_amount'],
      rangeFields: ['quantity'],
      schema: z.object({
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),

        // 🔹 ranges (ép string -> number)
        min_quantity: z.coerce.number().optional(),
        max_quantity: z.coerce.number().optional(),
        type: z.enum(stock_movement_type).optional(),
      }),
    })
    query,
  ) {
    const { data, total } = await this.stockMovementService.findAll(
      storeId,
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.STOCK_MOVEMENT_READ, PERMISSIONS.ALL], 'OR')
  @ApiSuccess('Find stock movement by Id successfully')
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.stockMovementService.findOne(storeId, id);
  }
}
