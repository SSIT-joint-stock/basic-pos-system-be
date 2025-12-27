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
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from 'app/common/decorators/user.decorator';
import { ApiSuccess } from 'app/common/decorators';
import { PermissionGuard } from 'app/permissions/guard/permission.guard';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUser } from 'app/common/types/user.type';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @ApiSuccess('Tạo cửa hàng thành công!')
  create(@Body() createStoreDto: CreateStoreDto, @User() user: IUser) {
    return this.storeService.create(createStoreDto, user);
  }

  @Get()
  @ApiSuccess('Get stores successfully')
  findAll(@User() user: IUser) {
    return this.storeService.findAll(user);
  }

  @Get(':storeId')
  @UseGuards(PermissionGuard)
  @RequirePermissions([PERMISSIONS.STORE_READ])
  @ApiSuccess('Lấy thông tin cửa hàng thành công!')
  findOne(@Param('storeId') storeId: string, @User() user: IUser) {
    return this.storeService.findOne(storeId, user);
  }

  @Patch(':storeId')
  @UseGuards(PermissionGuard)
  @RequirePermissions([PERMISSIONS.STORE_UPDATE, PERMISSIONS.STORE_ALL])
  @ApiSuccess('Cập nhật cửa hàng thành công!')
  update(
    @Param('storeId') storeId: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @User() user: IUser,
  ) {
    return this.storeService.update(storeId, updateStoreDto, user);
  }

  @Delete(':storeId')
  @ApiSuccess('Xoá cửa hàng thành công!')
  @UseGuards(PermissionGuard)
  @RequirePermissions([PERMISSIONS.STORE_DELETE, PERMISSIONS.STORE_ALL])
  remove(@Param('storeId') storeId: string, @User() user: IUser) {
    return this.storeService.remove(storeId, user);
  }
  // Get Permissions
  @Get('members/permissions/:storeId')
  @ApiSuccess('Get permissions in store successfully')
  getPermissionsInStore(
    @Param('storeId') storeId: string,
    @User() user: IUser,
  ) {
    return this.storeService.getPermissionsInStore(storeId, user);
  }
}
