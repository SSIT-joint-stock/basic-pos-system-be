import { inventory_status } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class SetStatusDto {
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId!: string;

  @IsEnum(inventory_status, { message: 'Invalid inventory status' })
  status!: inventory_status;
}
