import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { Roles } from 'app/common/decorators/roles.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { user_role, FeedbackStatus } from '@prisma/client';
import type { IUser } from 'app/common/types/user.type';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { z } from 'zod';

const FeedbackFilterSchema = z.object({
  status: z.nativeEnum(FeedbackStatus).optional(),
  userId: z.string().optional(),
  store_id: z.string().optional(),
});

@Controller('admin/feedback')
@Roles([user_role.ADMIN])
export class FeedbackAdminController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  async findAll(
    @FilterParse({
      schema: FeedbackFilterSchema,
      allowPagination: true,
      allowSorting: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'status'],
      searchBy: ['senderName', 'content'],
    })
    filter: FilterParseResult<any>,
  ) {
    return await this.feedbackService.findAllPaginated(filter.prismaQuery);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.feedbackService.getFeedbackById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @User() user: IUser,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return await this.feedbackService.updateStatus(id, user.id, dto);
  }

  @Post(':id/comment')
  async addComment(
    @Param('id') id: string,
    @User() user: IUser,
    @Body() dto: AddCommentDto,
  ) {
    return await this.feedbackService.addComment(id, user.id, user.role, dto);
  }
}
