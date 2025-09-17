import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserWithPermissions } from '../types/permission.type';

export const UserWithPermissions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUserWithPermissions => {
    const request = ctx.switchToHttp().getRequest();
    return request.userWithPermissions || request.user;
  },
);
