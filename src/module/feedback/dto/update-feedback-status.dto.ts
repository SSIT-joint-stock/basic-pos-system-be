import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FeedbackStatus } from '@prisma/client';

export class UpdateFeedbackStatusDto {
  @IsNotEmpty()
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}
