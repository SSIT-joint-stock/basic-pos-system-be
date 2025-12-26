import { Injectable } from '@nestjs/common';
import { provider_type } from '@prisma/client';
import { ValidationError } from 'app/common/response';
import { GoogleProfile } from 'app/common/types/google-profile.type';
import { AuthService } from 'app/module/auth/auth.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { TokenService } from '../auth/token.service';

@Injectable()
export class OauthService {
  private readonly errMsg = {
    USER_NOT_FOUND: 'Người dùng không tồn tại',
    INVALID_PROVIDER: 'Bạn không phải là thành viên của cửa hàng này',
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}
  async validateOauth(profile: GoogleProfile) {
    const { id, emails, name, displayName } = profile;

    const email = emails[0]?.value;
    const firstName = name?.givenName || '';
    const lastName = name?.familyName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    let user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    let access_token = '';
    let refresh_token = '';

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          username: fullName || displayName,
          provider_id: id,
          is_verified: true,
          provider: provider_type.GOOGLE,
          lastLoginAt: new Date(),
        },
      });
    }

    const tokenPair = this.tokenService.generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      username: user.username,
    });

    access_token = tokenPair.access_token;
    refresh_token = tokenPair.refresh_token;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refresh_token, lastLoginAt: new Date() },
    });

    const store = await this.prisma.store.findFirst({
      where: { owner_id: user.id },
    });
    return {
      user,
      access_token,
      refresh_token,
      hasStore: !!store,
    };
  }
  async refreshToken(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { id: payload.id, refresh_token: refreshToken },
    });
    if (!user) {
      throw new ValidationError('Người dùng không tồn tại');
    }
    const stores = await this.prisma.store.findMany({
      where: {
        owner_id: user?.id,
      },
    });

    this.authService.validateUserCanLogin(user);

    const tokens = this.tokenService.generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      username: user.username,
    });

    await this.authService.updateUserRefreshToken(
      user.id,
      tokens.refresh_token,
    );

    return { ...tokens, user, stores };
  }
}
