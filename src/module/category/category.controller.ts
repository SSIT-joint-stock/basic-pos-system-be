import express from 'express';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { ApiSuccess } from 'app/common/decorators';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import z from 'zod';
import { PaginatedResponse } from 'app/common/response';
import { ImportCategoryService } from './category-excel.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('stores/:storeId/categories')
@UseGuards(PermissionGuard)
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly excelCategory: ImportCategoryService,
  ) {}

  @Post()
  @RequirePermission([PERMISSIONS.CATEGORY_CREATE, PERMISSIONS.ALL])
  @ApiSuccess('Tạo danh mục thành công!')
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Param('storeId') storeId: string,
  ) {
    return this.categoryService.create(createCategoryDto, storeId);
  }

  @Get()
  @RequirePermission([PERMISSIONS.CATEGORY_READ, PERMISSIONS.ALL])
  @ApiSuccess('Categories retrieved successfully')
  async findAll(
    @Param('storeId') storeId: string,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'asc',
      allowedSortBy: ['createdAt', 'total_amount'],
      searchBy: ['name'], // thêm dòng này
      searchKey: 'q', // FIX: nếu muốn đổi tên key tìm kiếm
      schema: z.object({
        q: z.string().optional(),
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
    const { data, total } = await this.categoryService.findAll(
      storeId,
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get(':id')
  @RequirePermission([PERMISSIONS.CATEGORY_READ, PERMISSIONS.ALL])
  @ApiSuccess('Category found')
  findOne(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.categoryService.findOne(id, storeId);
  }

  @Patch(':id')
  @RequirePermission([PERMISSIONS.CATEGORY_UPDATE, PERMISSIONS.ALL])
  @ApiSuccess('Cập nhật thông tin danh mục thành công!')
  update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto, storeId);
  }

  @Delete(':id')
  @RequirePermission([PERMISSIONS.CATEGORY_DELETE, PERMISSIONS.ALL])
  @ApiSuccess('Xóa danh mục thành công!')
  remove(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.categoryService.remove(id, storeId);
  }

  // IMPORT CATEGORY EXCEL ROUTER
  @Get('/excel/example')
  @ApiSuccess('Tải thành công danh sách mẫu danh mục!')
  async download(@Res() res: express.Response) {
    const buffer = await this.excelCategory.downloadExampleCategory();
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
  @ApiSuccess('Tải danh sách danh mục thành công!')
  async export(
    @Res() res: express.Response,
    @Param('storeId') storeId: string,
  ) {
    const buffer = await this.excelCategory.getCategoryExcel(storeId);
    res.setHeader('Content-Disposition', 'attachment; filename=category.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }

  @Post('/excel/import')
  @UseInterceptors(FileInterceptor('excel_category'))
  @ApiSuccess('Nhập danh sách danh mục thành công!')
  async import(
    @Param('storeId') storeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.excelCategory.importCategoryExcel(storeId, file);
  }
}
