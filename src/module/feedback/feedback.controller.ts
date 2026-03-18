import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiSuccess } from 'app/common/decorators';
import { User } from 'app/common/decorators/user.decorator';
import type { IUser } from 'app/common/types/user.type';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiSuccess('Gửi phản hồi thành công. Chúng tôi sẽ phản hồi sớm nhất!')
  @Post()
  async create(@User() user: IUser, @Body() dto: CreateFeedbackDto) {
    return await this.feedbackService.createFeedback(user, dto);
  }

  @Get('my')
  async findMy(@User() user: IUser) {
    return await this.feedbackService.getUserFeedback(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.feedbackService.getFeedbackById(id);
  }
}
