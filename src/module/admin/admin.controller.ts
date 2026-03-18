import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  Inject,
} from '@nestjs/common';
import { user_role } from '@prisma/client';
import { ApiSuccess } from 'app/common/decorators';
import { Public } from 'app/common/decorators/public.decorator';
import { Roles } from 'app/common/decorators/roles.decorator';
import { User } from 'app/common/decorators/user.decorator';
import type { IUser } from 'app/common/types/user.type';
import { cookieConfig } from 'app/config';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminChangePasswordDto } from './dto/change-password.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    @Inject(cookieConfig.KEY)
    private readonly configCookie: ConfigType<typeof cookieConfig>,
  ) {}

  @Public()
  @Post('login')
  @ApiSuccess('Đăng nhập admin thành công!')
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.adminService.login(dto);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: this.configCookie.httpOnly,
      sameSite: this.configCookie.sameSite,
      domain: this.configCookie.domain || undefined,
      maxAge: this.configCookie.maxAge,
      secure: this.configCookie.secure,
    });

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Get('profile')
  @Roles([user_role.ADMIN])
  @ApiSuccess('Thông tin admin')
  async getProfile(@User() user: IUser) {
    return await this.adminService.getProfile(user.id);
  }

  @Patch('profile')
  @Roles([user_role.ADMIN])
  @ApiSuccess('Cập nhật thông tin thành công')
  async updateProfile(@User() user: IUser, @Body() dto: UpdateAdminProfileDto) {
    return await this.adminService.updateProfile(user.id, dto);
  }

  @Post('change-password')
  @Roles([user_role.ADMIN])
  @ApiSuccess('Đổi mật khẩu thành công')
  async changePassword(
    @User() user: IUser,
    @Body() dto: AdminChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.adminService.changePassword(user.id, dto);
    res.clearCookie('refresh_token');
  }

  @Post('logout')
  @Roles([user_role.ADMIN])
  @ApiSuccess('Đăng xuất thành công')
  async logout(@User() user: IUser, @Res({ passthrough: true }) res: Response) {
    await this.adminService.logout(user.id);
    res.clearCookie('refresh_token');
  }

  @Public()
  @Post('refresh-token')
  @ApiSuccess('Làm mới token thành công')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string | undefined>)
      ?.refresh_token;
    if (!refreshToken) {
      throw new Error('Refresh token is missing');
    }
    const result = await this.adminService.refreshToken(refreshToken);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: this.configCookie.httpOnly,
      sameSite: this.configCookie.sameSite,
      domain: this.configCookie.domain || undefined,
      maxAge: this.configCookie.maxAge,
      secure: this.configCookie.secure,
    });

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }
}
