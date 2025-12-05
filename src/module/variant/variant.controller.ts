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

@Controller('variant')
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @Post(':productId/create/:storeId')
  @ApiSuccess('Tạo biến thể cho sản phẩm thành công!')
  @RequirePermission([PERMISSIONS.VARIANT_CREATE, PERMISSIONS.VARIANT_ALL])
  create(
    @Body() createVariantDto: CreateVariantDto,
    @Param('productId') productId: string,
  ) {
    return this.variantService.create(createVariantDto, productId);
  }

  @Get(':id/product/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_READ, PERMISSIONS.VARIANT_ALL])
  findAll(@Param('id') id: string, @Param('productId') productId: string) {
    return this.variantService.findALlInProduct(id, productId);
  }

  @Patch(':id/update/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_UPDATE, PERMISSIONS.VARIANT_ALL])
  update(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() updateVariantDto: UpdateVariantDto,
  ) {
    return this.variantService.update(id, productId, updateVariantDto);
  }

  @Delete(':id/remove/:productId')
  @RequirePermission([PERMISSIONS.VARIANT_DELETE, PERMISSIONS.VARIANT_ALL])
  remove(@Param('id') id: string, @Param('productId') productId: string) {
    return this.variantService.remove(id, productId);
  }
}
