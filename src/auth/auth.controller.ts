import { EmailRequestDto } from './dto/email-request.dto';
import { Controller, Post, Body, Res, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiResponse } from 'app/common/response';
import express from 'express';
import { Public } from 'app/common/decorators/public.decorator';
import { User } from 'app/common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.authService.register(dto);
    return ApiResponse.success(
      null,
      'Account registered successfully. Please check your email for verification.',
    );
  }

  @Public()
  @Post('login')
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
    return ApiResponse.success(
      {
        access_token: result.access_token,
        user: result.user,
        token_type: 'Bearer',
      },
      'Login successful',
    );
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto);
    return ApiResponse.success(null, 'Email verified successfully');
  }

  @Public()
  @Post('reverify-email')
  async resendVerificationEmail(@Body() dto: EmailRequestDto) {
    await this.authService.resendVerificationEmail(dto);
    return ApiResponse.success(null, 'Verification email sent successfully');
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: EmailRequestDto) {
    await this.authService.forgotPassword(dto);
    return ApiResponse.success(null, 'Password reset code sent successfully');
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return ApiResponse.success(null, 'Password reset successfully');
  }

  // @Public()
  // @Post('refresh-token')
  // async refreshToken(
  //   @Req() req: express.Request,
  //   @Res({ passthrough: true }) res: express.Response,
  // ) {
  //   const refreshToken: string = req.cookies?.refresh_token;
  //   console.log(refreshToken);
  //   if (!refreshToken) {
  //     throw new UnauthorizedException('Refresh token not found in cookies');
  //   }

  //   try {
  //     // Call service với refresh token
  //     const result = await this.authService.refreshToken(refreshToken);

  //     // Update refresh token cookie với token mới
  //     res.cookie('refresh_token', result.refresh_token, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'strict',
  //       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  //       path: '/api/auth', // Chỉ gửi cookie đến auth endpoints
  //     });

  //     return ApiResponse.success(
  //       {
  //         access_token: result.access_token,
  //         user: result.user,
  //         token_type: 'Bearer',
  //         expires_in: 900, // 15 minutes
  //       },
  //       'Token refreshed successfully',
  //     );
  //   } catch (error) {
  //     // Clear invalid refresh token cookie
  //     res.cookie('refresh_token', {
  //       path: '/api/auth',
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'strict',
  //     });

  //     throw error;
  //   }
  // }

  @Post('logout')
  logout() {
    // return this.authService.logout();
    //  return ApiResponse.success(null, 'Logged out successfully');
  }
  @Get('profile')
  profile(@User() user: any) {
    return ApiResponse.success(
      { user, authenticated: true },
      'Profile fetched successfully',
    );
  }
}
