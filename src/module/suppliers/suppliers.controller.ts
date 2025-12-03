import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ApiSuccess } from 'app/common/decorators';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import z from 'zod';
import { PaginatedResponse } from 'app/common/response';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { supplier_status } from '@prisma/client';
import { ImportSupplierService } from './import-supplier.service';

@Controller('supplier')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly importSupplierService: ImportSupplierService,
  ) {}

  @Post(':storeId')
  @RequirePermission([PERMISSIONS.SUPPLIER_CREATE, PERMISSIONS.SUPPLIER_ALL])
  @ApiSuccess('Tạo nhà cung cấp thành công!')
  create(
    @Body() createSupplierDto: CreateSupplierDto,
    @Param('storeId') storeId: string,
  ) {
    return this.suppliersService.create(createSupplierDto, storeId);
  }

  @Get(':storeId')
  async findAll(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'name', 'email'],
      searchBy: ['code', 'name', 'tax_code', 'email'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
        code: z.string().optional(),
        tax_code: z.string().optional(),
        status: z.enum(supplier_status).optional(),
      }),
    })
    query: FilterParseResult<any>,
    @Param('storeId') storeId: string,
  ) {
    const { data, total } = await this.suppliersService.findAll(
      query.prismaQuery,
      storeId,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get(':storeId/detail/:id')
  @RequirePermission([PERMISSIONS.SUPPLIER_READ, PERMISSIONS.SUPPLIER_ALL])
  findOne(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.suppliersService.findOne(id, storeId);
  }

  @Patch(':storeId/update/:id')
  @RequirePermission([PERMISSIONS.SUPPLIER_UPDATE, PERMISSIONS.SUPPLIER_ALL])
  @ApiSuccess('Cập nhật thông tin thành công!')
  update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto, storeId);
  }

  @Delete(':storeId/delete/:id')
  @RequirePermission([PERMISSIONS.SUPPLIER_DELETE])
  @ApiSuccess('Xóa nhà cung cấp thành công!')
  remove(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.suppliersService.remove(id, storeId);
  }

  @Patch(':storeId/soft-delete/:id')
  @RequirePermission([PERMISSIONS.SUPPLIER_DELETE])
  @ApiSuccess('Xóa nhà cung cấp thành công!')
  softDelete(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.suppliersService.deleteSoft(id, storeId);
  }
}
