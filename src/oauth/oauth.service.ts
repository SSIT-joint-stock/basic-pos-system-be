// import { env } from './../../config/env.validation';
import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'app/shared/user.repository';
import { OAuth2Client } from 'google-auth-library';
import { OAuthInitDto } from './dto/oauth-init.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { TokenService } from 'app/auth/token.service';
import { PrismaService } from 'app/prisma/prisma.service';

import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from 'app/common/response/client-errors';
import { User } from '@prisma/client';
import { UsersService } from 'app/users/users.service';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  googleRefreshToken: string;
  googleAccessToken: string;
  user: User;
}

@Injectable()
export class OAuthService {
  private readonly oauth2Client: InstanceType<typeof OAuth2Client>;
  private readonly logger = new Logger(OAuthService.name);

  private readonly errorMessages = {
    MISSING_CLIENT_ID: 'Missing CLIENT_ID or CLIENT_SECRET',
    UNSUPPORTED_PROVIDER: 'Only Google OAuth is supported',

    // OAuth Flow
    MISSING_AUTH_CODE: 'Authorization code is missing',
    TOKEN_EXCHANGE_FAILED: 'Failed to exchange authorization code for tokens',
    INVALID_ID_TOKEN: 'Failed to verify ID token',
    MISSING_USER_PAYLOAD: 'Failed to retrieve user information from Google',

    // User Handling
    USER_CREATION_FAILED: 'Failed to create user account',
    USER_UPDATE_FAILED: 'Failed to update user account',
    REFRESH_TOKEN_UPDATE_FAILED: 'Failed to update refresh token in database',

    // Callback
    CALLBACK_FAILED: 'OAuth callback failed',
  } as const;

  constructor(
    private readonly users: UserRepository,
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
  ) {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadRequestError(this.errorMessages.MISSING_AUTH_CODE);
    }

    this.oauth2Client = new OAuth2Client(clientId, clientSecret);
  }
  //init oauth
  init(params: OAuthInitDto) {
    const { provider, redirectUri, state } = params;

    if (provider !== 'google') {
      throw new BadRequestError(this.errorMessages.UNSUPPORTED_PROVIDER);
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

  async callback(params: OAuthCallbackDto): Promise<AuthResponse> {
    const { code, redirectUri } = params;

    if (!code) {
      throw new BadRequestError(this.errorMessages.MISSING_AUTH_CODE);
    }

    try {
      const { tokens } = await this.oauth2Client.getToken({
        code,
        redirect_uri: redirectUri,
      });
      if (!tokens.id_token) {
        throw new UnauthorizedError(this.errorMessages.INVALID_ID_TOKEN);
      }

      this.oauth2Client.setCredentials(tokens);

      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedError(this.errorMessages.MISSING_USER_PAYLOAD);
      }

      const providerId = payload.sub;
      const email = payload.email || '';
      const username = await this.usersService.generateUsername(email);

      let user = await this.usersService.findByProviderId(providerId);
      if (user) {
        try {
          user = await this.usersService.update(user.id, {
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          });
        } catch {
          this.logger.error(`Failed to update user ${user.id}`);
          throw new ConflictError(this.errorMessages.USER_UPDATE_FAILED);
        }
      } else {
        try {
          user = await this.usersService.createOauthUser({
            providerId,
            email,
            username,
            password: null,
            provider: 'GOOGLE',
            is_verified: true,
            role: 'USER',
            status: 'ACTIVE',
            verification_code: null,
            verification_code_expired: null,
            password_reset_code: null,
            password_reset_code_expired: null,
            refresh_token: null,
          });
        } catch {
          this.logger.error(`Failed to create user ${email}`);
          throw new ValidationError(this.errorMessages.USER_CREATION_FAILED);
        }
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
      this.logger.error('OAuth callback failed');
      throw new ForbiddenError(
        `${this.errorMessages.CALLBACK_FAILED}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
