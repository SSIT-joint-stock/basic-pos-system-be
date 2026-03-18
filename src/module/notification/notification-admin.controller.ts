import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { user_role, notification_type } from '@prisma/client';
import { ApiSuccess } from 'app/common/decorators';
import { Roles } from 'app/common/decorators/roles.decorator';
import { User } from 'app/common/decorators/user.decorator';
import type { IUser } from 'app/common/types/user.type';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { z } from 'zod';

@Controller('admin/notifications')
@Roles([user_role.ADMIN])
export class NotificationAdminController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiSuccess('Tạo thông báo thành công')
  async create(@User() user: IUser, @Body() dto: CreateNotificationDto) {
    return this.notificationService.createNotification(dto, user.id);
  }

  @Get()
  @ApiSuccess('Danh sách thông báo (admin)')
  async getAll(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt'],
      schema: z.object({
        type: z.nativeEnum(notification_type).optional(),
      }),
    })
    query: FilterParseResult<any>,
  ) {
    return this.notificationService.adminGetAll(query.prismaQuery);
  }

  @Get(':id')
  @ApiSuccess('Chi tiết thông báo (admin)')
  async getById(@Param('id') id: string) {
    return this.notificationService.adminGetById(id);
  }
}
