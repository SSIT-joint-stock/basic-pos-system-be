import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUser } from 'app/common/types/user.type';
import type { ConfigType } from '@nestjs/config';
import { jwtConfig } from 'app/config';
import jwt, { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpires: string;
  private readonly refreshExpires: string;
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {
    this.accessSecret = config.jwtAccessSecret;
    this.refreshSecret = config.jwtRefreshSecret;
    this.accessExpires = config.jwtAccessExpires;
    this.refreshExpires = config.jwtRefreshExpires;
  }

  generateTokenPair(payload: IUser) {
    const access_token = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpires as jwt.SignOptions['expiresIn'],
    });
    const refresh_token = jwt.sign({ ...payload }, this.refreshSecret, {
      expiresIn: this.refreshExpires as jwt.SignOptions['expiresIn'],
    });
    return { access_token, refresh_token };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.accessSecret);
      if (typeof decoded === 'string') {
        throw new UnauthorizedException(
          'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại',
        );
      }
      return decoded;
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
      );
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshSecret);
      if (typeof decoded === 'string') {
        throw new UnauthorizedException(
          'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại',
        );
      }
      return decoded;
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại',
      );
    }
  }
}
