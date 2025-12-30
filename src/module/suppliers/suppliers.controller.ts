import express from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseInterceptors,
  UploadedFile,
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
import { ImportSupplierService } from './suppliers-excel.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('supplier')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    // private readonly importSupplierService: ImportSupplierService,
    private readonly excelSupplier: ImportSupplierService,
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

  @Get('/excel/example')
  @ApiSuccess('Tải thành công danh sách mẫu danh mục!')
  async download(@Res() res: express.Response) {
    const buffer = await this.excelSupplier.downloadExampleSupplier();
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

  @Post('/excel/import/:storeId')
  @UseInterceptors(FileInterceptor('excel_supplier'))
  @ApiSuccess('Nhập danh sách danh mục thành công!')
  async import(
    @Param('storeId') storeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.excelSupplier.importSupplierExcel(storeId, file);
  }

  @Get('/excel/export/:storeId')
  @ApiSuccess('Tải danh sách danh mục thành công!')
  async export(
    @Res() res: express.Response,
    @Param('storeId') storeId: string,
  ) {
    const buffer = await this.excelSupplier.exportSupplierExcel(storeId);
    res.setHeader('Content-Disposition', 'attachment; filename=supplier.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }
}
