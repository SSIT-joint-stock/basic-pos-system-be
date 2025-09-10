import { EmailRequestDto } from './dto/email-request.dto';
import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import express from 'express';
import { Public } from 'app/common/decorators/public.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { ApiSuccess } from 'app/common/decorators';
import type { IUSER } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiSuccess(
    'Account registered successfully. Please check your email for verification.',
  )
  async register(@Body() dto: RegisterDto) {
    await this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiSuccess('Login successful')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(dto);
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    return {
      access_token: result.access_token,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
      },
    };
  }

  @Public()
  @Post('verify-email')
  @ApiSuccess('Email verified successfully')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('reverify-email')
  @ApiSuccess('Verification email sent successfully')
  async resendVerificationEmail(@Body() dto: EmailRequestDto) {
    await this.authService.resendVerificationEmail(dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiSuccess('Password reset email sent successfully')
  async forgotPassword(@Body() dto: EmailRequestDto) {
    await this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiSuccess('Password reset successfully')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken: string = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    try {
      // Call service với refresh token
      const result = await this.authService.refreshToken(refreshToken);

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return {
        access_token: result.access_token,
        user: result.user,
        token_type: 'Bearer',
        expires_in: 900,
      };
    } catch (error) {
      res.clearCookie('refresh_token');
      throw error;
    }
  }

  @Post('logout')
  @ApiSuccess('Logged out successfully')
  logout(
    @User() user: IUSER,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    res.clearCookie('refresh_token');
    return this.authService.logout(user.id);
  }

  @Get('profile')
  @ApiSuccess('Profile fetched successfully')
  profile(@User() user: IUSER) {
    return user;
  }
}
