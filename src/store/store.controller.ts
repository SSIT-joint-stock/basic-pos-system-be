import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from 'app/common/decorators/user.decorator';
import type { IUSER } from 'app/auth/token.service';
import { ApiSuccess } from 'app/common/decorators';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @ApiSuccess('Store created successfully')
  create(@Body() createStoreDto: CreateStoreDto, @User() user: IUSER) {
    return this.storeService.create(createStoreDto, user);
  }

  // @UseGuards(RolesGuard)
  // @Roles([user_role.ADMIN])
  // @Get()
  // findAllByAdmin() {
  //   return this.storeService.findAllByAdmin();
  // }

  @Get()
  @ApiSuccess('Get stores successfully')
  findAll(@User() user: IUSER) {
    return this.storeService.findAll(user);
  }

  @Get(':id')
  @ApiSuccess('Get store successfully')
  findOne(@Param('id') id: string, @User() user: IUSER) {
    return this.storeService.findOne(id, user);
  }

  @Patch(':id')
  @ApiSuccess('Update store successfully')
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @User() user: IUSER,
  ) {
    return this.storeService.update(id, updateStoreDto, user);
  }

  @Delete(':id')
  @ApiSuccess('Delete store successfully')
  remove(@Param('id') id: string, @User() user: IUSER) {
    return this.storeService.remove(id, user);
  }

  // Store member management
  @Post('add-member/:storeId')
  @ApiSuccess('Add member to store successfully')
  addMemberToStore(
    @Param('storeId') storeId: string,
    @Body() body: { emailUser: string },
    @User() user: IUSER,
  ) {
    return this.storeService.addMemberToStore(storeId, body.emailUser, user);
  }

  @Delete('delete-member/:storeId')
  @ApiSuccess('Remove member from store successfully')
  removeMember(@Param('storeId') storeId: string, @User() user: IUSER) {
    return this.storeService.removeMember(storeId, user.id, user);
  }

  @Get('members/:storeId')
  @ApiSuccess('Get members in store successfully')
  getMembersInStore(@Param('storeId') storeId: string, @User() user: IUSER) {
    return this.storeService.getMembersInStore(storeId, user);
  }
}
