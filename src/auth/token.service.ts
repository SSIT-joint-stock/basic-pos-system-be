import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_ACCESS_SECRET = 'your-access-secret-key';
const JWT_REFRESH_SECRET = 'your-refresh-secret-key';
const JWT_ACCESS_EXPIRES_IN = '15m';
const JWT_REFRESH_EXPIRES_IN = '7d';

@Injectable()
export class TokenService {
  generateTokenPair(payload: { id: string; email: string }) {
    const access_token = jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
    const refresh_token = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
    return { access_token, refresh_token };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      if (typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      if (typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }
}
