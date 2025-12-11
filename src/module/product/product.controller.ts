/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import z from 'zod';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUserWithPermissions } from 'app/common/types/permission.type';
import { UserWithPermissions } from 'app/common/decorators/user-with-permissions.decorator';
import { ApiSuccess, RawResponse } from 'app/common/decorators';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import { PaginatedResponse } from 'app/common/response';
import { product_status } from '@prisma/client';
import { ImportProductService } from './import-product.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { CreateProductTemplateDto } from './dto/create-product-template-dto';
@Controller('stores/:storeId/products')
@UseGuards(PermissionGuard)
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly importProductService: ImportProductService,
    private readonly excel: ExcelTemplateService,
  ) {}

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
      searchBy: ['name', 'description'],
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

  // more service use case ...
  @Get('suggestions')
  @ApiSuccess('Lấy toàn bộ dự liệu sản phẩm!')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL], 'OR')
  async getProductSuggestion(
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
      }),
    })
    query,
  ) {
    const { data, total } = await this.productService.getProductSuggestion(
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Post('product-template')
  @RequirePermissions([PERMISSIONS.ALL])
  @ApiSuccess('Tạo template sản phẩm')
  createProductTemplate(@Body() items: CreateProductTemplateDto[]) {
    return this.productService.createProductsTemplate(items);
  }

  @Post('import-excel')
  @RequirePermissions([PERMISSIONS.PRODUCT_CREATE])
  @UseInterceptors(FileInterceptor('file'))
  @ApiSuccess('Nhập sản phẩm từ file excel thành công!')
  importExcel(
    @Param('storeId') storeId: string,
    @UserWithPermissions() user: IUserWithPermissions,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importProductService.importExcelFile(file);
  }

  @Post('import-template-excel')
  @RequirePermissions([PERMISSIONS.PRODUCT_CREATE])
  @UseInterceptors(FileInterceptor('file'))
  @ApiSuccess('Nhập template sản phẩm từ file excel thành công!')
  async importTemplateExcel(@UploadedFile() file: Express.Multer.File) {
    return this.importProductService.setProductTemplateByExcel(file);
  }

  @Post('example-product-excel')
  @RawResponse()
  @ApiSuccess('Lấy file mẫu sản phẩm thành công!')
  getExampleProductExcel(): StreamableFile {
    // return this.productService.downloadExampleExcel();
    return this.excel.downloadExampleExcel('product');
  }
}
