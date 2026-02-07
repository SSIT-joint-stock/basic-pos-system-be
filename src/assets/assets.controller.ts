/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiSuccess, RawResponse } from 'app/common/decorators';
import { FilterParse } from 'app/common/decorators/filter-parse.decorator';
import { Public } from 'app/common/decorators/public.decorator';
import { User } from 'app/common/decorators/user.decorator';
import {
  NotFoundError,
  PaginatedResponse,
  UnauthorizedError,
} from 'app/common/response';
import type { IUser } from 'app/common/types/user.type';
import type { Request, Response } from 'express';
import { Asset, AssetVisibility } from '@prisma/client';
import { CreateLinkDto } from './dto/create-link.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UploadAssetDto } from './dto/upload-asset.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { AssetAccessGuard } from './guards/asset-access.guard';
import { sanitizeFilename } from './utils/asset-utils';
import { AssetsService } from './assets.service';
import z from 'zod';

const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE);
const uploadOptions = {
  storage: memoryStorage(),
  ...(Number.isFinite(maxUploadSize)
    ? { limits: { fileSize: maxUploadSize } }
    : {}),
};

type RequestWithAsset = Request & { asset?: Asset };

@Controller('stores/:storeId/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  @ApiSuccess('Upload asset thành công')
  async upload(
    @Param('storeId') storeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAssetDto,
    @User() user: IUser,
  ) {
    if (!user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    return this.assetsService.uploadAsset(file, dto, user.id, storeId);
  }

  @Get('my')
  @ApiSuccess('Lấy danh sách asset đã tạo')
  async getMyAssets(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'size'],
      schema: z.object({
        visibility: z.enum(AssetVisibility).optional(),
      }),
    })
    query,
    @Param('storeId') storeId: string,
    @User() user: IUser,
  ) {
    if (!user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const { data, total } = await this.assetsService.listCreatedAssets(
      user.id,
      storeId,
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Public()
  @Get('public/:id')
  @RawResponse()
  async downloadPublic(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const asset = await this.assetsService.getPublicAsset(id, storeId);
    const stream = await this.assetsService.getDownloadStream(asset);

    this.setDownloadHeaders(res, asset);
    stream.pipe(res);
  }

  @Public()
  @Get('by-entity')
  @ApiSuccess('Lấy danh sách asset theo entity')
  async getByEntity(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt'],
      schema: z.object({
        entityType: z.string().min(1),
        entityId: z.string().min(1),
      }),
    })
    query,
    @Param('storeId') storeId: string,
    @User() user?: IUser,
  ) {
    const { entityType, entityId } = query.filters;
    const { data, total } = await this.assetsService.listByEntity(
      storeId,
      entityType,
      entityId,
      query.prismaQuery,
      user?.id,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Public()
  @Get(':id')
  @ApiSuccess('Lấy thông tin asset')
  async getAsset(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @User() user?: IUser,
  ) {
    return this.assetsService.getAssetInfo(id, storeId, user?.id);
  }

  @Patch(':id/visibility')
  @ApiSuccess('Cập nhật visibility asset thành công')
  async updateVisibility(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() dto: UpdateVisibilityDto,
    @User() user: IUser,
  ) {
    if (!user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    return this.assetsService.updateVisibility(
      id,
      storeId,
      dto.visibility,
      user.id,
    );
  }

  @Get(':id/download')
  @UseGuards(AssetAccessGuard)
  @RawResponse()
  async downloadPrivate(@Req() req: RequestWithAsset, @Res() res: Response) {
    const asset = req.asset;
    if (!asset) {
      throw new NotFoundError('Asset');
    }

    const stream = await this.assetsService.getDownloadStream(asset);
    this.setDownloadHeaders(res, asset);
    stream.pipe(res);
  }

  @Post(':id/permissions')
  @ApiSuccess('Cấp quyền asset thành công')
  async grantPermissions(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() dto: CreatePermissionDto,
    @User() user: IUser,
  ) {
    if (!user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    return this.assetsService.grantPermissions(id, storeId, dto, user.id);
  }

  @Delete(':id')
  @ApiSuccess('Xóa asset thành công')
  async deleteAsset(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @User() user: IUser,
  ) {
    if (!user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    return this.assetsService.deleteAsset(id, storeId, user.id);
  }

  @Delete(':id/permissions')
  @ApiSuccess('Thu hồi quyền asset thành công')
  async revokePermissions(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() dto: CreatePermissionDto,
    @User() user: IUser,
  ) {
    if (!user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    return this.assetsService.revokePermissions(id, storeId, dto, user.id);
  }

  @Post(':id/links')
  @ApiSuccess('Gắn asset vào entity thành công')
  async attachLink(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() dto: CreateLinkDto,
    @User() user: IUser,
  ) {
    if (!user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    return this.assetsService.attachLink(id, storeId, dto, user.id);
  }

  private setDownloadHeaders(res: Response, asset: Asset): void {
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${sanitizeFilename(asset.originalName)}"`,
    );
    res.setHeader('Content-Length', asset.size.toString());
  }
}
