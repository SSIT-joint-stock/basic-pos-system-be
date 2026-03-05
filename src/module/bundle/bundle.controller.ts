import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from 'app/common/decorators/api-response.decorator';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUser } from 'app/common/types/user.type';
import z from 'zod';
import { BundleService } from './bundle.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

@ApiTags('Bundle')
@Controller('bundles')
export class BundleController {
  constructor(private readonly bundleService: BundleService) {}

  @Post()
  @ApiSuccess('Tạo combo thành công!')
  @RequirePermissions([PERMISSIONS.PRODUCT_CREATE])
  create(@User() user: IUser, @Body() createBundleDto: CreateBundleDto) {
    return this.bundleService.create(createBundleDto, user.storeId || '');
  }

  @Get()
  @ApiSuccess('Lấy danh sách combo!')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL])
  async findAll(
    @User() user: IUser,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'name', 'price', 'quantity', 'sku'],
      searchBy: ['name', 'sku'],
      schema: z.object({
        q: z.string().optional(),
      }),
    })
    query: FilterParseResult<any>,
  ) {
    const { data, total } = await this.bundleService.findAll(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get(':id')
  @ApiSuccess('Lấy chi tiết combo!')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL])
  findOne(@User() user: IUser, @Param('id') id: string) {
    return this.bundleService.findOne(id, user.storeId || '');
  }

  @Patch(':id')
  @ApiSuccess('Cập nhật combo thành công!')
  @RequirePermissions([PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_ALL])
  update(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() updateBundleDto: UpdateBundleDto,
  ) {
    return this.bundleService.update(id, updateBundleDto, user.storeId || '');
  }

  @Delete(':id')
  @ApiSuccess('Xóa combo thành công!')
  @RequirePermissions([PERMISSIONS.PRODUCT_DELETE])
  remove(@User() user: IUser, @Param('id') id: string) {
    return this.bundleService.remove(id, user.storeId || '');
  }
}
