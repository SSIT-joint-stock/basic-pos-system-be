import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SatisfactionRating } from '@prisma/client';

export class CreateFeedbackDto {
  @IsNotEmpty({
    message: 'Vui lòng nhập tiêu đề',
  })
  @IsString()
  title: string;

  @IsNotEmpty({
    message: 'Vui lòng nhập nội dung',
  })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  senderPhone?: string;

  @IsOptional()
  @IsString()
  senderAddress?: string;

  @IsOptional()
  @IsEnum(SatisfactionRating)
  satisfactionRating?: SatisfactionRating;
}
