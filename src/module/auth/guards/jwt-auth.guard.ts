import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'app/common/decorators/public.decorator';
import { UnauthorizedError } from 'app/common/response';
import { TokenService } from '../token.service';

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
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const payload = this.tokenService.verifyAccessToken(token);
          request.user = payload;
        } catch {
          // Ignore invalid token on public routes
        }
      }
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // get token form header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(
        'Access token not found in Authorization header',
      );
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedError(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!',
      );
    }
  }
}
