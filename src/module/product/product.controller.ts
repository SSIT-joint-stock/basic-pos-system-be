import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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

@Controller('stores/:storeId/products')
@UseGuards(PermissionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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
  findAll(@Param('storeId') storeId: string) {
    return this.productService.findAll(storeId);
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
