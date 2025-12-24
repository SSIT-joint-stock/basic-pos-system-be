import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import { GoogleProfile } from 'app/common/types/google-profile.type';
import { provider_type } from '@prisma/client';

@Injectable()
export class OauthService {
  constructor(
    private readonly prisma: PrismaService,
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
    const { access_token, refresh_token } = this.tokenService.generateTokenPair(
      {
        id: user?.id || '',
        email: user?.email || '',
        username: user?.username || '',
        role: user?.role || '',
        status: user?.status || '',
      },
    );
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          username: fullName || displayName,
          provider_id: id,
          is_verified: true,
          refresh_token: refresh_token,
          provider: provider_type.GOOGLE,
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { refresh_token: refresh_token, lastLoginAt: new Date() },
      });
    }
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
}
