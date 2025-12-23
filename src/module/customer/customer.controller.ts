import express from 'express'; /* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { ApiSuccess } from 'app/common/decorators';
import z from 'zod';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginatedResponse } from 'app/common/response';
import { ImportCustomerService } from './customer-excel.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('stores/:storeId/customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly excelCustomer: ImportCustomerService,
  ) {}

  @Post()
  @RequirePermissions([PERMISSIONS.PRODUCT_CREATE]) //FIX: fix this later
  @ApiSuccess('Create customer successfully')
  create(
    @Param('storeId') storeId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customerService.create(storeId, createCustomerDto);
  }

  @Get()
  @ApiSuccess('Find all customers successfully')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL], 'OR') //Fix: fix this later
  async findAll(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt'],
      searchBy: ['name'], // thêm dòng này
      searchKey: 'q', // FIX: nếu muốn đổi tên key tìm kiếm
      schema: z.object({
        q: z.string().optional(), // ⬅️ thêm q vào schema
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        country: z.string().optional(),
      }),
    })
    query,
    @Param('storeId') storeId: string,
  ) {
    const { data, total } = await this.customerService.findAll(
      storeId,
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get(':id')
  @ApiSuccess('Find customer by Id successfully')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL], 'OR')
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.customerService.findOne(storeId, id);
  }

  @Patch(':id')
  @RequirePermissions(
    [PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_ALL],
    'OR',
  )
  @ApiSuccess('Update customer successfully')
  update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(storeId, id, updateCustomerDto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.PRODUCT_DELETE])
  @ApiSuccess('Delete customer successfully')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.customerService.remove(storeId, id);
  }

  @Get('/excel/example')
  @ApiSuccess('Tải thành công danh sách mẫu danh mục!')
  async download(@Res() res: express.Response) {
    const buffer = await this.excelCustomer.downloadExampleCustomer();
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=customer_template.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.end(buffer);
  }

  @Post('/excel/import')
  @UseInterceptors(FileInterceptor('excel_customer'))
  @ApiSuccess('Nhập danh sách danh mục thành công!')
  async import(
    @Param('storeId') storeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.excelCustomer.importCustomerExcel(storeId, file);
  }

  @Get('/excel/export')
  @ApiSuccess('Tải danh sách danh mục thành công!')
  async export(
    @Res() res: express.Response,
    @Param('storeId') storeId: string,
  ) {
    const buffer = await this.excelCustomer.getCustomerExcel(storeId);
    res.setHeader('Content-Disposition', 'attachment; filename=customer.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }
}
