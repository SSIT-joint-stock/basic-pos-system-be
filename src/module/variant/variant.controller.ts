import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { stock_movement_type } from '@prisma/client';
import { ApiSuccess } from 'app/common/decorators';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUser } from 'app/common/types/user.type';
import { VariantExcelService } from 'app/module/variant/inventory-excel.service';
import express from 'express';
import z from 'zod';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { ApplyStockUseCase } from './use-case/apply-stock.usecase';
import { VariantService } from './variant.service';

@Controller('variant')
export class VariantController {
  constructor(
    private readonly variantService: VariantService,
    private readonly applyStock: ApplyStockUseCase,
    private readonly variantExcelService: VariantExcelService,
  ) {}

  @Post(':productId/create/')
  @ApiSuccess('Tạo biến thể cho sản phẩm thành công!')
  @RequirePermission([PERMISSIONS.VARIANT_CREATE, PERMISSIONS.VARIANT_ALL])
  create(
    @Body() createVariantDto: CreateVariantDto,
    @Param('productId') productId: string,
    @User() user: IUser,
  ) {
    return this.variantService.create(
      createVariantDto,
      productId,
      user?.storeId || '',
    );
  }

  @Get('product/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_READ, PERMISSIONS.VARIANT_ALL])
  findAll(@Param('productId') productId: string, @User() user: IUser) {
    return this.variantService.findALlInProduct(productId, user?.storeId || '');
  }

  @Get(':id/product/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_READ, PERMISSIONS.VARIANT_ALL])
  findOne(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @User() user: IUser,
  ) {
    return this.variantService.findOneInProduct(
      id,
      productId,
      user?.storeId || '',
    );
  }
  @Get('')
  @RequirePermission([PERMISSIONS.VARIANT_READ, PERMISSIONS.VARIANT_ALL])
  async findAllByStore(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'price', 'name'],
      rangeFields: ['price'],
      searchBy: ['name', 'sku', 'barcode'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(), // ⬅️ thêm q vào schema
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
        min_price: z.coerce.number().optional(),
        max_price: z.coerce.number().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        categories: z.string().optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() { storeId }: IUser,
  ) {
    const { data, total } = await this.variantService.findAll(
      storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Patch(':id/update/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_UPDATE, PERMISSIONS.VARIANT_ALL])
  @ApiSuccess('Cập nhật biến thể thành công!')
  update(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() updateVariantDto: UpdateVariantDto,
    @User() user: IUser,
  ) {
    return this.variantService.update(
      id,
      productId,
      updateVariantDto,
      user?.storeId || '',
    );
  }

  @Delete(':id/remove/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_DELETE, PERMISSIONS.VARIANT_ALL])
  @ApiSuccess('Xóa biến thể thành công!')
  remove(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @User() user: IUser,
  ) {
    return this.variantService.remove(id, productId, user?.storeId || '');
  }

  @Patch(':id/apply-stock/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_UPDATE, PERMISSIONS.VARIANT_ALL])
  @ApiSuccess('Cập nhật tồn kho thành công!')
  async applyStockVariant(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() { delta, type }: { delta: number; type: stock_movement_type },
    @User() user: IUser,
  ) {
    return this.variantService.applyStockForVariant(
      type,
      user,
      id,
      productId,
      delta,
    );
  }

  // EXCEL
  @Get('/excel/export/')
  async exportPurchaseOrdersExcel(
    @Res() res: express.Response,
    @Param('storeId') storeId: string,
  ) {
    const buffer = await this.variantExcelService.exportInventory(storeId);

    res.setHeader('Content-Disposition', 'attachment; filename=ton_kho.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.end(buffer);
  }
}
