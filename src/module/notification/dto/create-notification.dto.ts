import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';
import {
  notification_type,
  notification_target_type,
  user_role,
} from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(notification_type)
  @IsOptional()
  type?: notification_type = notification_type.ADMIN;

  @IsEnum(notification_target_type)
  @IsOptional()
  target_type?: notification_target_type = notification_target_type.ALL;

  /* Required when target_type = ROLE */
  @IsEnum(user_role)
  @IsOptional()
  target_role?: user_role;

  /* Required when target_type = USER */
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  target_user_ids?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  /** ISO date string — if provided, notification is scheduled (stored but not fanned-out until that time) */
  @IsDateString()
  @IsOptional()
  scheduled_at?: string;
}
