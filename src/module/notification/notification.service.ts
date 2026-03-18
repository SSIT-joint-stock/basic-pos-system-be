import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import {
  notification_target_type,
  notification_type,
  Prisma,
  user_role,
  user_status,
} from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotFoundError, ValidationError } from 'app/common/response';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification and fan-out UserNotification records to targeted users.
   * @param dto  - Payload from admin or system
   * @param createdBy - User ID of creator; null = system-generated
   */
  async createNotification(
    dto: CreateNotificationDto,
    createdBy: string | null = null,
  ) {
    const {
      title,
      content,
      type = notification_type.SYSTEM,
      target_type = notification_target_type.ALL,
      target_role,
      target_user_ids,

      scheduled_at,
    } = dto;

    // Validation
    if (target_type === notification_target_type.ROLE && !target_role) {
      throw new ValidationError(
        'target_role là bắt buộc khi target_type = ROLE',
      );
    }
    if (
      target_type === notification_target_type.USER &&
      (!target_user_ids || target_user_ids.length === 0)
    ) {
      throw new ValidationError(
        'target_user_ids là bắt buộc khi target_type = USER',
      );
    }

    // Create the base notification record
    const notification = await this.prisma.notification.create({
      data: {
        title,
        content,
        type,
        target_type,
        target_role: target_role ?? null,
        created_by: createdBy,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
      },
    });

    // Fan-out: only immediately if not scheduled
    if (!scheduled_at) {
      await this.fanOut(
        notification.id,
        target_type,
        target_role,
        target_user_ids,
      );
    }

    return notification;
  }

  /**
   * System-generated shortcut — called from other modules.
   * Fire-and-forget: does NOT throw, just logs errors.
   */
  async createSystemNotification(
    dto: Omit<CreateNotificationDto, 'type' | 'scheduled_at'> & {
      type?: notification_type;
    },
  ): Promise<void> {
    try {
      await this.createNotification(
        { ...dto, type: dto.type ?? notification_type.SYSTEM },
        null,
      );
    } catch (err) {
      console.error(
        '[NotificationService] Failed to create system notification:',
        err,
      );
    }
  }

  /**
   * Fan-out: create UserNotification rows for all target users.
   */
  private async fanOut(
    notificationId: string,
    targetType: notification_target_type,
    targetRole?: user_role | null,
    targetUserIds?: string[],
  ) {
    let userIds: string[] = [];

    if (targetType === notification_target_type.ALL) {
      const users = await this.prisma.user.findMany({
        where: { status: user_status.ACTIVE },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (targetType === notification_target_type.ROLE && targetRole) {
      const users = await this.prisma.user.findMany({
        where: { role: targetRole, status: user_status.ACTIVE },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (
      targetType === notification_target_type.USER &&
      targetUserIds?.length
    ) {
      userIds = targetUserIds;
    }

    if (userIds.length === 0) return;

    await this.prisma.userNotification.createMany({
      data: userIds.map((userId) => ({
        notification_id: notificationId,
        user_id: userId,
        is_read: false,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * List notifications for a specific user (paginated).
   */
  async getNotificationsForUser(
    userId: string,
    query: Prisma.UserNotificationFindManyArgs,
  ) {
    const { where, skip, take, orderBy } = query;

    if (where?.notification?.target_type) {
      where.notification = {
        target_type: where.notification.target_type,
      };
    }

    const finalWhere = {
      ...where,
      user_id: userId,
    };

    const [data, total] = await Promise.all([
      this.prisma.userNotification.findMany({
        where: finalWhere,
        skip,
        take,
        orderBy,
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              content: true,
              type: true,
              metadata: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.userNotification.count({ where: finalWhere }),
    ]);

    return {
      data,
      total,
    };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.userNotification.count({
      where: { user_id: userId, is_read: false },
    });
    return { count };
  }

  /**
   * Get detail of a single UserNotification.
   */
  async getNotificationDetail(userId: string, notificationId: string) {
    const record = await this.prisma.userNotification.findFirst({
      where: { user_id: userId, notification_id: notificationId },
      include: { notification: true },
    });

    if (!record) {
      throw new NotFoundError('Không tìm thấy thông báo');
    }

    return record;
  }

  /**
   * Mark one notification as read for a user.
   */
  async markAsRead(userId: string, notificationId: string) {
    const record = await this.prisma.userNotification.findFirst({
      where: { user_id: userId, notification_id: notificationId },
    });

    if (!record) {
      throw new NotFoundError('Không tìm thấy thông báo');
    }

    if (record.is_read) {
      return record; // already read
    }

    return this.prisma.userNotification.update({
      where: { id: record.id },
      data: { is_read: true, read_at: new Date() },
    });
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.userNotification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
    return { updated: result.count };
  }

  // ─── Admin Methods ───────────────────────────────────────────────────────────

  /**
   * Admin: list all base notifications (paginated).
   */
  async adminGetAll(prismaQuery: {
    where: Record<string, any>;
    skip: number;
    take: number;
    orderBy: Record<string, 'asc' | 'desc'>;
  }) {
    const { where, skip, take, orderBy } = prismaQuery;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          creator: {
            select: { id: true, username: true, email: true },
          },
          _count: { select: { user_notifications: true } },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Admin: get notification detail by ID.
   */
  async adminGetById(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, username: true, email: true },
        },
        _count: { select: { user_notifications: true } },
      },
    });

    if (!notification) {
      throw new NotFoundError('Không tìm thấy thông báo');
    }

    return notification;
  }
}
