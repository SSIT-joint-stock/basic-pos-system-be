import { Injectable, Logger } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'app/users/users.service';
import { PrismaService } from 'app/prisma/prisma.service';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'app/common/response';
import { EmailService } from 'app/email/email.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailRequestDto } from './dto/email-request.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { BcryptService } from 'app/common/helpers/bcrypt.util';
import { CodeService } from 'app/common/helpers/code.util';
import { user_status, User } from '@prisma/client';
import { TokenService } from './token.service';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly errorMessages = {
    // Authentication
    INVALID_CREDENTIALS: 'Invalid email/username or password',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    INVALID_ACCESS_TOKEN: 'Invalid or expired access token',

    // Verification
    INVALID_VALIDATION_CODE: 'Invalid verification code',
    CODE_EXPIRED: 'Verification code has expired',

    // Account Status
    ACCOUNT_INACTIVE: 'Account is inactive. Please contact support',
    EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
    EMAIL_ALREADY_VERIFIED: 'Email is already verified',

    // User Management
    USER_NOT_FOUND: 'User not found',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
    USERNAME_ALREADY_EXISTS: 'Username is already taken',
  } as const;

  constructor(
    private readonly userService: UsersService,
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly bcryptService: BcryptService,
    private readonly codeService: CodeService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    await this.validateUserDoesNotExist(dto.email, dto.username);

    const { code, expiredAt } = this.codeService.generateCodeWithExpiry();
    const hashedPassword = await this.bcryptService.hashPassword(dto.password);

    await this.prismaService.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        verification_code: code,
        verification_code_expired: expiredAt,
      },
    });

    this.sendVerificationEmailAsync(dto.email, code, expiredAt);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const user = await this.findUserByEmail(dto.email);

    if (user.is_verified) {
      throw new ValidationError(this.errorMessages.EMAIL_ALREADY_VERIFIED);
    }

    this.validateVerificationCode(user, dto.code);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        verification_code: null,
        verification_code_expired: null,
        is_verified: true,
      },
    });
  }

  async resendVerificationEmail(dto: EmailRequestDto): Promise<void> {
    const user = await this.findUserByEmail(dto.email);

    if (user.is_verified) {
      throw new ValidationError(this.errorMessages.EMAIL_ALREADY_VERIFIED);
    }

    const { code, expiredAt } = this.codeService.generateCodeWithExpiry();

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        verification_code: code,
        verification_code_expired: expiredAt,
      },
    });

    this.sendVerificationEmailAsync(dto.email, code, expiredAt);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmailOrUsername(
      dto.usernameOrEmail,
    );
    if (!user) {
      throw new NotFoundError(this.errorMessages.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this.bcryptService.comparePassword(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ValidationError(this.errorMessages.INVALID_CREDENTIALS);
    }

    this.validateUserCanLogin(user);

    const tokens = this.tokenService.generateTokenPair({
      id: user.id,
      email: user.email,
    });

    await this.updateUserRefreshToken(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user,
    };
  }

  async forgotPassword(dto: EmailRequestDto): Promise<void> {
    const user = await this.findUserByEmail(dto.email);
    const { code, expiredAt } = this.codeService.generateCodeWithExpiry();

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        password_reset_code: code,
        password_reset_code_expired: expiredAt,
      },
    });

    this.sendPasswordResetEmailAsync(dto.email, code, expiredAt);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.prismaService.user.findFirst({
      where: {
        password_reset_code: dto.resetToken,
      },
    });

    if (!user) {
      throw new ValidationError(this.errorMessages.INVALID_VALIDATION_CODE);
    }

    if (
      !user.password_reset_code_expired ||
      this.codeService.isCodeExpired(user.password_reset_code_expired)
    ) {
      await this.clearPasswordResetCode(user.id);
      throw new ValidationError(this.errorMessages.CODE_EXPIRED);
    }

    const hashedPassword = await this.bcryptService.hashPassword(dto.password);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        password_reset_code: null,
        password_reset_code_expired: null,
        refresh_token: null,
      },
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.id,
        refresh_token: refreshToken,
      },
    });

    if (!user) {
      throw new ValidationError(this.errorMessages.INVALID_REFRESH_TOKEN);
    }

    this.validateUserCanLogin(user);

    const tokens = this.tokenService.generateTokenPair({
      id: user.id,
      email: user.email,
    });

    await this.updateUserRefreshToken(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
  }

  // Private helper methods
  private async validateUserDoesNotExist(
    email: string,
    username: string,
  ): Promise<void> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.userService.findByEmail(email),
      this.userService.findByUsername(username),
    ]);

    if (existingEmail) {
      throw new ConflictError(this.errorMessages.EMAIL_ALREADY_EXISTS);
    }

    if (existingUsername) {
      throw new ConflictError(this.errorMessages.USERNAME_ALREADY_EXISTS);
    }
  }

  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundError(this.errorMessages.USER_NOT_FOUND);
    }
    return user;
  }

  private validateVerificationCode(user: User, code: string): void {
    if (user.verification_code !== code) {
      throw new ValidationError(this.errorMessages.INVALID_VALIDATION_CODE);
    }

    if (
      !user.verification_code_expired ||
      this.codeService.isCodeExpired(user.verification_code_expired)
    ) {
      throw new ValidationError(this.errorMessages.CODE_EXPIRED);
    }
  }

  private validateUserCanLogin(user: User): void {
    if (!user.is_verified) {
      throw new ValidationError(this.errorMessages.EMAIL_NOT_VERIFIED);
    }

    if (user.status !== user_status.ACTIVE) {
      throw new ValidationError(this.errorMessages.ACCOUNT_INACTIVE);
    }
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

  private async clearPasswordResetCode(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password_reset_code: null,
        password_reset_code_expired: null,
      },
    });
  }

  private sendVerificationEmailAsync(
    email: string,
    code: string,
    expiredAt: Date,
  ): void {
    setImmediate(() => {
      this.emailService
        .sendVerificationEmail(email, code, expiredAt)
        .then(() => {
          this.logger.log(`Verification email sent to: ${email}`);
        })
        .catch((error) => {
          this.logger.error(
            `Failed to send verification email to ${email}:`,
            error,
          );
        });
    });
  }

  private sendPasswordResetEmailAsync(
    email: string,
    code: string,
    expiredAt: Date,
  ): void {
    setImmediate(() => {
      this.emailService
        .sendForgotPasswordEmail(email, code, expiredAt)
        .then(() => {
          this.logger.log(`Password reset email sent to: ${email}`);
        })
        .catch((error) => {
          this.logger.error(
            `Failed to send password reset email to ${email}:`,
            error,
          );
        });
    });
  }
}
