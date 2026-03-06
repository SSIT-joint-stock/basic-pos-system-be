import express from 'express';

import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { product_status } from '@prisma/client';
import { ApiSuccess } from 'app/common/decorators';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { BadRequestError, PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { type IUser } from 'app/common/types/user.type';
import { ProductExcelService } from 'app/module/product/product-excel.service';
import z from 'zod';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportExcelProductDto } from './dto/import-product-by-excel.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly excel: ProductExcelService,
  ) {}

  @Get('filter-product')
  @ApiSuccess('Lấy toàn bộ dự liệu sản phẩm!')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL])
  async filterProducts(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'name'],
      searchBy: ['name', 'description', 'sku'],
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
    query: FilterParseResult<any>,
    @User() user: IUser,
  ) {
    const { data, total } = await this.productService.filterProducts(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Post()
  @RequirePermissions([PERMISSIONS.PRODUCT_CREATE])
  @ApiSuccess('Tạo sản phẩm thành công!')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @User() user: IUser,
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productService.create(
      user,
      user.storeId || '',
      createProductDto,
      file,
    );
  }

  @Get(':id')
  @ApiSuccess('Lấy chi tiết sản phẩm!')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL])
  findOne(@User() user: IUser, @Param('id') id: string) {
    return this.productService.findOne(user.storeId || '', id);
  }

  @Patch(':id')
  @RequirePermissions([PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_ALL])
  @ApiSuccess('Cập nhật sản phẩm thành công!')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productService.update(
      user.storeId || '',
      id,
      updateProductDto,
      user,
      file,
    );
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.PRODUCT_DELETE])
  @ApiSuccess('Xóa sản phẩm thành công!')
  remove(@User() user: IUser, @Param('id') id: string) {
    return this.productService.remove(user.storeId || '', id);
  }

  // Excel
  @Get('excel/template')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ])
  async downloadProductTemplate(@Res() res: express.Response) {
    const buffer = await this.excel.downloadTemplateProduct();

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=mau_san_pham.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.end(buffer);
  }
  // Excel
  @Get('excel/export')
  @RequirePermissions([PERMISSIONS.PRODUCT_READ])
  async exportProduct(@Res() res: express.Response, @User() user: IUser) {
    const buffer = await this.excel.exportProductExcel(user.storeId || '');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=danh_sach_san_pham.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.end(buffer);
  }

  @Post('excel/import/validation')
  @UseInterceptors(FileInterceptor('product_validation'))
  @ApiSuccess('Kiểm tra file nhập hàng thành công!')
  async validationImportProduct(
    @User() { storeId }: IUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /(spreadsheet|excel|vnd.openxmlformats)/,
          }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!storeId)
      throw new BadRequestError('Lỗi khi tìm cửa hàng. Vui lòng đăng nhập lại');
    return await this.excel.checkValidationImportProduct(file, storeId);
  }

  @Post('excel/import/save')
  @ApiSuccess('Tạo sản phẩm bằng file excel thành công!')
  async importProduct(@User() user: IUser, @Body() dto: ImportExcelProductDto) {
    return await this.excel.importProduct(dto, user.storeId || '', user.id);
  }
}
