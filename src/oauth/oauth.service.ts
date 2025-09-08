// import { env } from './../../config/env.validation';
import { Injectable } from '@nestjs/common';
import { UserRepository } from 'app/shared/user.repository';
import { OAuth2Client } from 'google-auth-library';
import { OAuthInitDto } from './dto/oauth-init.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { AuthResultDto } from './dto/auth-result.dto';
import { TokenService } from 'app/auth/token.service';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class OAuthService {
  private readonly oauth2Client: InstanceType<typeof OAuth2Client>;

  constructor(
    private readonly users: UserRepository,
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('Missing CLIENT_ID or CLIENT_SECRET');
    }

    this.oauth2Client = new OAuth2Client(clientId, clientSecret);
  }
  init(params: OAuthInitDto) {
    const { provider, redirectUri, state } = params;

    if (provider !== 'google') {
      throw new Error('Only Google OAuth is supported');
    }

    const scopes = ['profile', 'email', 'openid'];
    const authorizeUrl = this.oauth2Client.generateAuthUrl({
      redirect_uri: redirectUri,
      scope: scopes,
      state,
      access_type: 'offline',
    });

    return { authUrl: authorizeUrl, state };
  }

  private async updateUserRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refresh_token: refreshToken },
    });
  }

  async callback(params: OAuthCallbackDto): Promise<AuthResultDto> {
    const { code, redirectUri } = params;

    if (!code) {
      throw new Error('Authorization code missing');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken({
        code,
        redirect_uri: redirectUri,
      });

      this.oauth2Client.setCredentials(tokens);

      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Failed to get user info');
      }

      const providerId = payload.sub;
      const email = payload.email || '';
      const username = await this.users.generateUsername(email);

      let user = await this.users.findByProviderId(providerId);
      if (user) {
        // chỉ update login time
        user = await this.users.update(user.id, {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // tạo mới
        user = await this.users.create({
          providerId,
          email,
          username,
          password: null,
          provider: 'GOOGLE',
          is_verified: true,
          role: 'USER', // default role
          status: 'ACTIVE', // default status
          verification_code: null,
          verification_code_expired: null,
          password_reset_code: null,
          password_reset_code_expired: null,
          refresh_token: null,
        });
      }

      const tokenPair = this.tokenService.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        username: user.username,
      });

      await this.updateUserRefreshToken(user.id, tokenPair.refresh_token);

      return {
        accessToken: tokenPair.access_token,
        refreshToken: tokenPair.refresh_token,
        user,
        googleAccessToken: tokens.access_token || '',
        googleRefreshToken: tokens.refresh_token || '',
      };
    } catch (error) {
      throw new Error(
        `OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
