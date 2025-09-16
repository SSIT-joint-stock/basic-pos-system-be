/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUserWithPermissions } from 'app/common/types/permission.type';
import { UserWithPermissions } from 'app/common/decorators/user-with-permissions.decorator';
import { ApiSuccess } from 'app/common/decorators';
import { FilterProductsDto } from './dto/filter-product.dto';
import z from 'zod';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import { PaginatedResponse } from 'app/common/response';

@Controller('stores/:storeId/products')
@UseGuards(PermissionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('filter-product')
  @ApiSuccess('Filter product successfully')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL], 'OR')
  async filterProducts(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'total_amount'],
      schema: z.object({
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query,
    @Param('storeId') storeId: string,
    @Query() dto: FilterProductsDto,
  ) {
    const { data, total } = await this.productService.filterProducts(
      storeId,
      dto,
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Post()
  @RequirePermissions([PERMISSIONS.PRODUCT_CREATE])
  @ApiSuccess('Create product successfully')
  create(
    @Param('storeId') storeId: string,
    @UserWithPermissions() user: IUserWithPermissions,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(user, storeId, createProductDto);
  }

  @Get()
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL], 'OR')
  @ApiSuccess('Find all product successfully')
  async findAll(
    @Param('storeId') storeId: string,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'total_amount'],
      schema: z.object({
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
    const { data, total } = await this.productService.findAll(storeId, query);
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get(':id')
  @ApiSuccess('Find product by Id successfully')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL], 'OR')
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.productService.findOne(storeId, id);
  }

  @Patch(':id')
  @RequirePermissions(
    [PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_ALL],
    'OR',
  )
  @ApiSuccess('Update product successfully')
  update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(storeId, id, updateProductDto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.PRODUCT_DELETE])
  @ApiSuccess('Delete product successfully')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.productService.remove(storeId, id);
  }
}
