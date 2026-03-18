import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import {
  CommenterType,
  FeedbackStatus,
  user_role,
  Prisma,
} from '@prisma/client';
import { IUser } from 'app/common/types/user.type';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(user: IUser, dto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        ...dto,
        store_id: user.storeId,
        userId: user.id,
        senderName: dto.senderName || user.username,
        status: FeedbackStatus.PROCESSING,
        ratedAt: dto.satisfactionRating ? new Date() : null,
      },
    });
  }

  async getAllFeedback(userRole: user_role) {
    if (userRole !== user_role.ADMIN) {
      throw new ForbiddenException('Only admins can view all feedback');
    }
    return this.prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        store: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserFeedback(userId: string) {
    return this.prisma.feedback.findMany({
      where: { userId },
      include: {
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFeedbackById(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        user: true,
        store: true,
        comments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  async updateStatus(
    id: string,
    adminId: string,
    dto: UpdateFeedbackStatusDto,
  ) {
    return this.prisma.feedback.update({
      where: { id },
      data: {
        status: dto.status,
        rejectReason: dto.rejectReason,
        assignedToId: adminId,
      },
    });
  }

  async addComment(
    id: string,
    userId: string,
    userRole: user_role,
    dto: AddCommentDto,
  ) {
    if (userRole !== user_role.ADMIN) {
      throw new ForbiddenException('Only admins can comment on feedback');
    }
    await this.getFeedbackById(id);

    return this.prisma.feedbackComment.create({
      data: {
        content: dto.content,
        feedbackId: id,
        userId,
        type: CommenterType.ADMIN,
        isAdmin: true,
      },
    });
  }

  async findAllPaginated(prismaQuery: Prisma.FeedbackFindManyArgs) {
    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        ...prismaQuery,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          store: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      this.prisma.feedback.count({ where: prismaQuery.where }),
    ]);
    return { data, total };
  }
}
