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
  @ApiSuccess('Store created successfully')
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
  @ApiSuccess('Get store successfully')
  findOne(@Param('storeId') storeId: string, @User() user: IUser) {
    return this.storeService.findOne(storeId, user);
  }

  @Patch(':storeId')
  @UseGuards(PermissionGuard)
  @RequirePermissions([PERMISSIONS.STORE_UPDATE, PERMISSIONS.STORE_ALL])
  @ApiSuccess('Update store successfully')
  update(
    @Param('storeId') storeId: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @User() user: IUser,
  ) {
    return this.storeService.update(storeId, updateStoreDto, user);
  }

  @Delete(':storeId')
  @ApiSuccess('Delete store successfully')
  @UseGuards(PermissionGuard)
  @RequirePermissions([PERMISSIONS.STORE_DELETE, PERMISSIONS.STORE_ALL])
  remove(@Param('storeId') storeId: string, @User() user: IUser) {
    return this.storeService.remove(storeId, user);
  }

  // Store member management
  @Post('add-member/:storeId')
  @ApiSuccess('Add member to store successfully')
  addMemberToStore(
    @Param('storeId') storeId: string,
    @Body() body: { emailUser: string },
    @User() user: IUser,
  ) {
    return this.storeService.addMemberToStore(storeId, body.emailUser, user);
  }

  @Delete('delete-member/:storeId')
  @ApiSuccess('Remove member from store successfully')
  removeMember(@Param('storeId') storeId: string, @User() user: IUser) {
    return this.storeService.removeMember(storeId, user.id, user);
  }

  @Get('members/:storeId')
  @ApiSuccess('Get members in store successfully')
  getMembersInStore(@Param('storeId') storeId: string, @User() user: IUser) {
    return this.storeService.getMembersInStore(storeId, user);
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
