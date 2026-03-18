import { Controller, Get, Patch, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { User } from 'app/common/decorators/user.decorator';
import { ApiSuccess } from 'app/common/decorators';
import type { IUser } from 'app/common/types/user.type';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { z } from 'zod';
import { notification_type } from '@prisma/client';
import { PaginatedResponse } from 'app/common/response';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiSuccess('Danh sách thông báo')
  async getMyNotifications(
    @User() user: IUser,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt'],
      schema: z.object({
        is_read: z
          .preprocess(
            (val) =>
              val === 'true' ? true : val === 'false' ? false : undefined,
            z.boolean(),
          )
          .optional(),
        type: z.nativeEnum(notification_type).optional(),
      }),
    })
    query: FilterParseResult<any>,
  ) {
    const { data, total } =
      await this.notificationService.getNotificationsForUser(
        user.id,
        query.prismaQuery,
      );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get('unread-count')
  @ApiSuccess('Số thông báo chưa đọc')
  async getUnreadCount(@User() user: IUser) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Get(':id')
  @ApiSuccess('Chi tiết thông báo')
  async getDetail(@User() user: IUser, @Param('id') id: string) {
    return this.notificationService.getNotificationDetail(user.id, id);
  }

  @Patch(':id/read')
  @ApiSuccess('Đánh dấu đã đọc thành công')
  async markAsRead(@User() user: IUser, @Param('id') id: string) {
    return this.notificationService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @ApiSuccess('Đánh dấu tất cả đã đọc thành công')
  async markAllAsRead(@User() user: IUser) {
    return this.notificationService.markAllAsRead(user.id);
  }
}
