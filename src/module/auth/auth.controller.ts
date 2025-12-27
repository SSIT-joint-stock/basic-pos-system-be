import { EmailRequestDto } from './dto/email-request.dto';
import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
  Param,
  Inject,
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
import type { IUser } from 'app/common/types/user.type';
import type { ConfigType } from '@nestjs/config';
import { cookieConfig } from 'app/config';
import { Throttle } from '@nestjs/throttler';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(cookieConfig.KEY)
    private readonly configCookie: ConfigType<typeof cookieConfig>,
  ) {}
  // Helper method to get cookie options

  @Public()
  @Post('register')
  @ApiSuccess(
    'Tạo tài khoản thành công. Vui lòng kiểm tra email để xác thực tài khoản!',
  )
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
      },
    };
  }

  @Public()
  @Post('login')
  @ApiSuccess('Đăng nhập thành công!')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(dto);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: this.configCookie.httpOnly,
      sameSite: this.configCookie.sameSite,
      domain: this.configCookie.domain || undefined,
      maxAge: this.configCookie.maxAge,
      secure: this.configCookie.secure,
    });
    return {
      access_token: result.access_token,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
      },
      stores: result.stores,
    };
  }

  @Public()
  @Post('verify-email')
  @ApiSuccess('Tài khoản xác thực thành công!')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto);
  }

  @Public()
  @Throttle({ default: { limit: 1, ttl: 30000 } })
  @Post('reverify-email')
  @ApiSuccess('Gửi mã xác thực tài khoản thành công. Vui lòng kiểm tra email!')
  async resendVerificationEmail(@Body() dto: EmailRequestDto) {
    await this.authService.resendVerificationEmail(dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiSuccess('Mã đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email!')
  async forgotPassword(@Body() dto: EmailRequestDto) {
    await this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiSuccess('Đặt lại mật khẩu thành công!')
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
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!',
      );
    }

    try {
      // Call service với refresh token
      const result = await this.authService.refreshToken(refreshToken);

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: this.configCookie.httpOnly,
        sameSite: this.configCookie.sameSite,
        domain: this.configCookie.domain || undefined,
        maxAge: this.configCookie.maxAge,
        secure: this.configCookie.secure,
      });

      return {
        access_token: result.access_token,
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role,
        },
        store: result.store,
        token_type: 'Bearer',
        expires_in: 900,
      };
    } catch (error) {
      res.clearCookie('refresh_token');
      throw error;
    }
  }

  @Post('logout')
  @ApiSuccess('Tài khoản đăng xuất thành công!')
  logout(
    @User() user: IUser,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    res.clearCookie('refresh_token');
    return this.authService.logout(user.id);
  }

  @Get('profile')
  @ApiSuccess('Thông tin tài khoản')
  async profile(@User() user: IUser) {
    return await this.authService.profile(user.id, user.storeId!);
  }

  @Post('set-current-store/:storeId')
  @ApiSuccess('Chọn cửa hàng hiện tại thành công. Đang chuyển trang...')
  async setCurrentStore(
    @User() user: IUser,
    @Param('storeId') storeId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.setCurrentStore(user.id, storeId);
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: this.configCookie.httpOnly,
      sameSite: this.configCookie.sameSite,
      domain: this.configCookie.domain || undefined,
      maxAge: this.configCookie.maxAge,
      secure: this.configCookie.secure,
    });
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      store: {
        id: result.store.id,
        name: result.store.name,
      },
    };
  }
}
