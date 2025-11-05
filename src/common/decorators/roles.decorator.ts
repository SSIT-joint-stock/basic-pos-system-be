import { Reflector } from '@nestjs/core';
import { user_role } from '@prisma/client';

export const Roles = Reflector.createDecorator<user_role[]>();
