import express from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { ApiSuccess } from 'app/common/decorators';
import { User } from 'app/common/decorators/user.decorator';
import type { IUser } from 'app/common/types/user.type';

import { StoreMemberService } from './store-member.service';
import { AddExistingMemberDto } from './dto/add-existing-member.dto';
import { CreateAndAddMemberDto } from './dto/create-and-add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { StoreMemberExcelService } from './store-member-excel.service';
import { Response } from 'express';
@Controller('store-member')
export class StoreMemberController {
  constructor(
    private readonly storeMemberService: StoreMemberService,
    private readonly storeMemberExcelService: StoreMemberExcelService,
  ) {}

  @Post('add-member/:storeId')
  @ApiSuccess('Thêm thành viên thành công')
  addMemberLegacy(
    @Param('storeId') storeId: string,
    @Body() dto: AddExistingMemberDto,
    @User() user: IUser,
  ) {
    return this.storeMemberService.addExistingUserToStore(storeId, dto, user);
  }

  @Delete('delete-member/:storeId')
  @ApiSuccess('Xóa thành viên thành công')
  removeMemberLegacy(
    @Param('storeId') storeId: string,
    @Body('memberUserId') memberUserId: string,
    @User() user: IUser,
  ) {
    return this.storeMemberService.removeMember(storeId, memberUserId, user);
  }

  @Get('members/:storeId')
  @ApiSuccess('Get members in store successfully')
  getMembersLegacy(@Param('storeId') storeId: string, @User() user: IUser) {
    return this.storeMemberService.getMembers(storeId, user);
  }

  @Post(':storeId/members/create')
  @ApiSuccess('Tạo và thêm thành viên vào cửa hàng thành công')
  createAndAddMember(
    @Param('storeId') storeId: string,
    @Body() dto: CreateAndAddMemberDto,
    @User() user: IUser,
  ) {
    return this.storeMemberService.createAndAddMember(storeId, dto, user);
  }

  @Get(':storeId/members/:memberUserId')
  @ApiSuccess('Lấy thông tin thành viên trong cửa hàng thành công')
  getMemberDetail(
    @Param('storeId') storeId: string,
    @Param('memberUserId') memberUserId: string,
    @User() user: IUser,
  ) {
    return this.storeMemberService.getMemberDetail(storeId, memberUserId, user);
  }

  @Patch(':storeId/members/:memberUserId/role')
  @ApiSuccess('Cập nhật vai trò thành viên thành công')
  updateMemberRole(
    @Param('storeId') storeId: string,
    @Param('memberUserId') memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @User() user: IUser,
  ) {
    return this.storeMemberService.updateMemberRole(
      storeId,
      memberUserId,
      dto,
      user,
    );
  }
  @Get(':storeId/excel/template')
  async downloadStoreMemberTemplate(@Res() res: express.Response) {
    const buffer =
      await this.storeMemberExcelService.downloadExampleStoreMember();

    res.set({
      'Content-Disposition': 'attachment; filename=thanh_vien_cua_hang.xlsx',
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  /**
   * Export danh sách Store Member
   * GET /api/v1/store-member/:storeId/excel/export
   */
  @Get(':storeId/excel/export')
  async exportStoreMembersExcel(
    @Param('storeId') storeId: string,
    @User() user: IUser,
    @Res() res: express.Response,
  ) {
    const buffer = await this.storeMemberExcelService.exportStoreMembers(
      storeId,
      user,
    );

    res.set({
      'Content-Disposition': 'attachment; filename=thanh_vien_cua_hang.xlsx',
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
