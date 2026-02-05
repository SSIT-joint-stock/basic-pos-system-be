/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { product_status } from '@prisma/client';
import { ApiSuccess } from 'app/common/decorators';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { UserWithPermissions } from 'app/common/decorators/user-with-permissions.decorator';
import { PaginatedResponse } from 'app/common/response';
import type { IUserWithPermissions } from 'app/common/types/permission.type';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';
import z from 'zod';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
@Controller('stores/:storeId/products')
@UseGuards(PermissionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('filter-product')
  @ApiSuccess('Lấy toàn bộ dự liệu sản phẩm!')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL], 'OR')
  async filterProducts(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'name'],
      searchBy: ['name', 'description', 'sku', 'barcode'],
      searchKey: 'q',
      listFields: ['categories'],
      schema: z.object({
        q: z.string().optional(), // ⬅️ thêm q vào schema
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        image_url: z.string().url().optional(),
        product_status: z.enum(product_status).optional(),
        categories: z.string().optional(),
      }),
    })
    query,
    @Param('storeId') storeId: string,
  ) {
    const { data, total } = await this.productService.filterProducts(
      storeId,
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Post()
  @RequirePermissions([PERMISSIONS.PRODUCT_CREATE])
  @ApiSuccess('Tạo sản phẩm thành công!')
  create(
    @Param('storeId') storeId: string,
    @UserWithPermissions() user: IUserWithPermissions,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(user, storeId, createProductDto);
  }

  @Get(':id')
  @ApiSuccess('Lấy chi tiết sản phẩm!')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL], 'OR')
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.productService.findOne(storeId, id);
  }

  @Patch(':id')
  @RequirePermissions(
    [PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_ALL],
    'OR',
  )
  @ApiSuccess('Cập nhật sản phẩm thành công!')
  update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(storeId, id, updateProductDto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.PRODUCT_DELETE])
  @ApiSuccess('Xóa sản phẩm thành công!')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.productService.remove(storeId, id);
  }
}
