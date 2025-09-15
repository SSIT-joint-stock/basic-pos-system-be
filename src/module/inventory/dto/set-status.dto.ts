import { inventory_status } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetStatusDto {
  @IsEnum(inventory_status, { message: 'Invalid inventory status' })
  status!: inventory_status;
}
