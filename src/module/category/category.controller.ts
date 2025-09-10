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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import { ApiSuccess } from 'app/common/decorators';

@Controller('stores/:storeId/categories')
@UseGuards(PermissionGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @RequirePermission([PERMISSIONS.CATEGORY_CREATE])
  @ApiSuccess('Category created successfully')
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Param('storeId') storeId: string,
  ) {
    return this.categoryService.create(createCategoryDto, storeId);
  }

  @Get()
  @RequirePermission([PERMISSIONS.CATEGORY_READ])
  @ApiSuccess('Categories retrieved successfully')
  findAll(@Param('storeId') storeId: string) {
    return this.categoryService.findAll(storeId);
  }

  @Get(':id')
  @RequirePermission([PERMISSIONS.CATEGORY_READ])
  @ApiSuccess('Category found')
  findOne(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.categoryService.findOne(id, storeId);
  }

  @Patch(':id')
  @RequirePermission([PERMISSIONS.CATEGORY_UPDATE])
  @ApiSuccess('Category updated successfully')
  update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto, storeId);
  }

  @Delete(':id')
  @RequirePermission([PERMISSIONS.CATEGORY_DELETE])
  @ApiSuccess('Category deleted successfully')
  remove(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.categoryService.remove(id, storeId);
  }
}
