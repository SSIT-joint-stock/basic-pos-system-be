import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ApiSuccess } from 'app/common/decorators';
import { User } from 'app/common/decorators/user.decorator';
import type { IUser } from 'app/common/types/user.type';
import express from 'express';

import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermissions } from 'app/common/decorators/permission.decorator';
import { NotFoundError, PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import z from 'zod';
import { AddExistingMemberDto } from './dto/add-existing-member.dto';
import { CreateAndAddMemberDto } from './dto/create-and-add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { StoreMemberExcelService } from './store-member-excel.service';
import { StoreMemberService } from './store-member.service';
@Controller('store-member')
export class StoreMemberController {
  constructor(
    private readonly storeMemberService: StoreMemberService,
    private readonly storeMemberExcelService: StoreMemberExcelService,
  ) {}

  @Post('add-member')
  @RequirePermissions([PERMISSIONS.MEMBER_CREATE])
  @ApiSuccess('Thêm thành viên thành công')
  addMemberLegacy(@Body() dto: AddExistingMemberDto, @User() user: IUser) {
    if (!user.storeId) throw new NotFoundError('User not in store');
    return this.storeMemberService.addExistingUserToStore(
      user.storeId,
      dto,
      user,
    );
  }

  @Delete('delete-member')
  @RequirePermissions([PERMISSIONS.MEMBER_DELETE])
  @ApiSuccess('Xóa thành viên thành công')
  removeMemberLegacy(
    @Body('memberUserId') memberUserId: string,
    @User() user: IUser,
  ) {
    if (!user.storeId) throw new NotFoundError('User not in store');
    return this.storeMemberService.removeMember(
      user.storeId,
      memberUserId,
      user,
    );
  }

  @Get('members')
  @RequirePermissions([PERMISSIONS.MEMBER_READ])
  @ApiSuccess('Get members in store successfully')
  async getMembersLegacy(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'name'],
      searchBy: ['username', 'email'],
      searchKey: 'q',
      listFields: ['categories'],
      schema: z.object({
        q: z.string().optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() user: IUser,
  ) {
    const { data, total } = await this.storeMemberService.getMembers(
      user.storeId || '',
      query.prismaQuery,
      user,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Post('create')
  @RequirePermissions([PERMISSIONS.MEMBER_CREATE])
  @ApiSuccess('Tạo và thêm thành viên vào cửa hàng thành công')
  createAndAddMember(@Body() dto: CreateAndAddMemberDto, @User() user: IUser) {
    return this.storeMemberService.createAndAddMember(
      user.storeId || '',
      dto,
      user,
    );
  }

  @Get('members/:memberUserId')
  @RequirePermissions([PERMISSIONS.MEMBER_READ])
  @ApiSuccess('Lấy thông tin thành viên trong cửa hàng thành công')
  getMemberDetail(
    @Param('memberUserId') memberUserId: string,
    @User() user: IUser,
  ) {
    return this.storeMemberService.getMemberDetail(
      user.storeId || '',
      memberUserId,
      user,
    );
  }

  @Patch('members/:memberUserId/role')
  @RequirePermissions([PERMISSIONS.MEMBER_UPDATE])
  @ApiSuccess('Cập nhật vai trò thành viên thành công')
  updateMemberRole(
    @Param('memberUserId') memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @User() user: IUser,
  ) {
    return this.storeMemberService.updateMemberRole(
      user.storeId || '',
      memberUserId,
      dto,
      user,
    );
  }

  /**
   * Export danh sách Store Member
   * GET /api/v1/store-member/:storeId/excel/export
   */
  @Get('excel/export')
  @RequirePermissions([PERMISSIONS.MEMBER_READ])
  async exportStoreMembersExcel(
    @User() user: IUser,
    @Res() res: express.Response,
  ) {
    const buffer = await this.storeMemberExcelService.exportStoreMembers(
      user.storeId || '',
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
