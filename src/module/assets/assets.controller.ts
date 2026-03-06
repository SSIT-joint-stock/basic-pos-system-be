import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'app/common/decorators/roles.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { type IUser } from 'app/common/types/user.type';
import { ListAssetsDto } from 'app/module/assets/dto/list-assets.dto';
import { JwtAuthGuard } from 'app/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'app/module/auth/guards/roles.guard';
import { type Response } from 'express';
import { AssetsService } from './assets.service';
import { UploadAssetDto } from './dto/upload-asset.dto';

@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * Upload a file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @User() user: IUser,
    @UploadedFile() file: Express.Multer.File,
    @Query() dto: UploadAssetDto,
  ) {
    return this.assetsService.uploadFile(user, file, dto);
  }

  /**
   * Get asset metadata
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetsService.getAsset(id);
  }

  /**
   * List all assets (Admin only)
   */
  @Get()
  @Roles(['ADMIN'])
  async findAll(@Query() dto: ListAssetsDto) {
    return this.assetsService.listAssets(dto);
  }

  /**
   * Delete an asset
   */
  @Delete(':id')
  async remove(@User() user: IUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.assetsService.deleteAsset(id, user);
  }

  /**
   * Stream a private file
   */
  @Get('private/:id/stream')
  async streamPrivate(
    @User() user: IUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { stream, asset } = await this.assetsService.getDownloadStream(
      id,
      user,
    );

    res.set({
      'Content-Type': asset.mime_type,
      'Content-Disposition': `inline; filename="${asset.original_name}"`,
    });

    stream.pipe(res);
  }
}
