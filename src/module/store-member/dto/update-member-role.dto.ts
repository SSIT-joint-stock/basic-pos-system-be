import { IsEnum } from 'class-validator';
import { StoreMemberRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(StoreMemberRole)
  role: StoreMemberRole;
}
