import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VariantService } from './variant.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { ApiSuccess } from 'app/common/decorators';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { User } from 'app/common/decorators/user.decorator';
import type { IUser } from 'app/common/types/user.type';
import { stock_movement_type } from '@prisma/client';
import { ApplyStockUseCase } from './use-case/apply-stock.usecase';

@Controller('variant')
export class VariantController {
  constructor(
    private readonly variantService: VariantService,
    private readonly applyStock: ApplyStockUseCase,
  ) {}

  @Post(':productId/create/')
  @ApiSuccess('Tạo biến thể cho sản phẩm thành công!')
  @RequirePermission([PERMISSIONS.VARIANT_CREATE, PERMISSIONS.VARIANT_ALL])
  create(
    @Body() createVariantDto: CreateVariantDto,
    @Param('productId') productId: string,
    @User() user: IUser,
  ) {
    return this.variantService.create(
      createVariantDto,
      productId,
      user?.storeId || '',
    );
  }

  @Get('product/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_READ, PERMISSIONS.VARIANT_ALL])
  findAll(@Param('productId') productId: string, @User() user: IUser) {
    return this.variantService.findALlInProduct(productId, user?.storeId || '');
  }

  @Get(':id/product/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_READ, PERMISSIONS.VARIANT_ALL])
  findOne(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @User() user: IUser,
  ) {
    return this.variantService.findOneInProduct(
      id,
      productId,
      user?.storeId || '',
    );
  }

  @Patch(':id/update/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_UPDATE, PERMISSIONS.VARIANT_ALL])
  @ApiSuccess('Cập nhật biến thể thành công!')
  update(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() updateVariantDto: UpdateVariantDto,
    @User() user: IUser,
  ) {
    return this.variantService.update(
      id,
      productId,
      updateVariantDto,
      user?.storeId || '',
    );
  }

  @Delete(':id/remove/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_DELETE, PERMISSIONS.VARIANT_ALL])
  @ApiSuccess('Xóa biến thể thành công!')
  remove(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @User() user: IUser,
  ) {
    return this.variantService.remove(id, productId, user?.storeId || '');
  }

  @Post(':id/apply-stock/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_UPDATE, PERMISSIONS.VARIANT_ALL])
  async applyStockVariant(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() { delta, type }: { delta: number; type: stock_movement_type },
    @User() user: IUser,
  ) {
    return this.applyStock.execute(
      type,
      user?.storeId || '',
      id,
      productId,
      delta,
    );
  }
}
