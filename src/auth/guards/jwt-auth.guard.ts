import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TokenService } from '../token.service';
import { ForbiddenError } from 'app/common/response';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'app/common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector, // ← Inject Reflector để đọc metadata
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // check if is public endpoint
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // get token form header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenError(
        'Access token not found in Authorization header',
      );
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      request.user = payload;

      return true;
    } catch {
      throw new ForbiddenError('Invalid or expired access token');
    }
  }
}
