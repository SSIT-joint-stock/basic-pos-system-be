import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Asset,
  asset_access_type,
  asset_type,
  user_role,
} from '@prisma/client';
import { type IUser } from 'app/common/types/user.type';
import { storageConfig } from 'app/config';
import { PrismaService } from 'app/prisma/prisma.service';
import * as path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { AssetWithUrl } from './dto/asset-response.dto';
import { ListAssetsDto } from './dto/list-assets.dto';
import { UploadAssetDto } from './dto/upload-asset.dto';
import { FileValidatorService } from './services/file-validator.service';
import type { IStorageService } from './services/storage.interface';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);
  private readonly cdnUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('IStorageService') private readonly storage: IStorageService,
    private readonly fileValidator: FileValidatorService,
    @Inject(storageConfig.KEY)
    private readonly config: ConfigType<typeof storageConfig>,
  ) {
    this.cdnUrl = this.config.cdnUrl;
  }

  /**
   * Upload a file and save metadata to DB
   */
  async uploadFile(
    user: IUser,
    file: Express.Multer.File,
    dto: UploadAssetDto,
  ): Promise<AssetWithUrl> {
    // 1. Validate File
    this.fileValidator.validateFile(file);

    // 2. Process Upload
    return this.processUpload(user, file, dto);
  }

  /**
   * Internal common upload logic
   */
  private async processUpload(
    user: IUser | null,
    file: Express.Multer.File,
    dto: UploadAssetDto,
  ): Promise<AssetWithUrl> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const accessType = dto.accessType
      ? (dto.accessType as asset_access_type)
      : asset_access_type.PUBLIC;

    const folderPath = dto.folder
      ? `${year}/${month}/${dto.folder}`
      : `${year}/${month}`;
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${Date.now()}_${uuidv4()}${fileExt}`;

    // 3. Save to Storage
    const { path: relativePath, size } = await this.storage.save(
      file,
      folderPath,
      uniqueName,
      accessType,
    );

    const storeId = user?.storeId;
    if (!storeId) {
      throw new ForbiddenException('store_id is required');
    }

    // 4. Save to Database
    const asset = await this.prisma.asset.create({
      data: {
        store_id: storeId,
        original_name: file.originalname,
        filename: uniqueName,
        mime_type: file.mimetype,
        size: size,
        path: relativePath,
        access_type: accessType,
        type: this.determineAssetType(file.mimetype),
        uploaded_by_id: user?.id || null,
        folder: dto.folder || null,
        metadata: {},
        links:
          dto.entityId && dto.entityType
            ? {
                create: {
                  store_id: storeId,
                  entity_id: dto.entityId,
                  entity_type: dto.entityType,
                },
              }
            : undefined,
      },
    });

    return this.enrichAssetUrl(asset);
  }

  /**
   * Granular permission check
   */
  checkPermission(
    asset: Asset,
    user: IUser,
    action: 'READ' | 'WRITE' | 'DELETE',
  ): boolean {
    // Admin has all permissions
    if (user.role === user_role.ADMIN) return true;

    // Owner has all permissions
    if (asset.uploaded_by_id === user.id) return true;

    if (action === 'READ') {
      // Public assets can be read by anyone
      if (asset.access_type === asset_access_type.PUBLIC) return true;
      // Temporary assets are usually public-ish for the session
      if (asset.access_type === asset_access_type.TEMP) return true;
    }

    // Default: Forbidden
    return false;
  }

  /**
   * Cleanup temporary assets (older than 24h)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupTempAssets() {
    this.logger.log('Starting cleanup of temporary assets...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tempAssets = await this.prisma.asset.findMany({
      where: {
        access_type: asset_access_type.TEMP,
        created_at: { lt: yesterday },
        is_deleted: false,
      },
    });

    for (const asset of tempAssets) {
      try {
        await this.storage.delete(asset.path);
        await this.prisma.asset.update({
          where: { id: asset.id },
          data: { is_deleted: true },
        });
        this.logger.debug(`Cleaned up temp asset: ${asset.filename}`);
      } catch (error) {
        this.logger.error(
          `Failed to cleanup temp asset ${asset.filename}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Get asset by ID
   */
  async getAsset(id: string): Promise<AssetWithUrl> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });

    if (!asset || asset.is_deleted) {
      throw new NotFoundException('Asset not found');
    }

    return this.enrichAssetUrl(asset);
  }

  /**
   * List assets (for Admin)
   */
  async listAssets(dto: ListAssetsDto) {
    const {
      page = 1,
      limit = 10,
      uploadedById,
      type,
      accessType,
      folder,
    } = dto;
    const skip = (page - 1) * limit;

    const where = {
      is_deleted: false,
      uploaded_by_id: uploadedById,
      type,
      access_type: accessType,
      folder: folder ? { contains: folder } : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      items: items.map((asset) => this.enrichAssetUrl(asset)),
      total,
      page,
      limit,
    };
  }

  /**
   * Delete asset (Soft Delete)
   */
  async deleteAsset(id: string, user: IUser): Promise<void> {
    const asset = await this.prisma.asset.findUnique({ where: { id } });

    if (!asset || asset.is_deleted) {
      throw new NotFoundException('Asset not found');
    }

    if (!this.checkPermission(asset, user, 'DELETE')) {
      throw new ForbiddenException(
        'You do not have permission to delete this asset',
      );
    }

    // 1. Mark as deleted in DB
    await this.prisma.asset.update({
      where: { id },
      data: { is_deleted: true },
    });

    // 2. Delete from storage
    try {
      await this.storage.delete(asset.path);
    } catch (error) {
      this.logger.warn(
        `Failed to delete file on disk for asset ${id}: ${error.message}`,
      );
    }
  }

  /**
   * Get download stream
   */
  async getDownloadStream(
    id: string,
    user: IUser,
  ): Promise<{ stream: Readable; asset: Asset }> {
    const asset = await this.prisma.asset.findUnique({ where: { id } });

    if (!asset || asset.is_deleted) {
      throw new NotFoundException('Asset not found');
    }

    if (!this.checkPermission(asset, user, 'READ')) {
      throw new ForbiddenException(
        'You do not have permission to access this asset',
      );
    }

    const stream = await this.storage.getStream(asset.path);
    return { stream, asset };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private determineAssetType(mime: string): asset_type {
    if (mime.startsWith('image/')) return asset_type.IMAGE;
    if (mime.startsWith('video/')) return asset_type.VIDEO;
    if (mime.startsWith('audio/')) return asset_type.AUDIO;
    if (mime === 'application/pdf' || mime.includes('document'))
      return asset_type.DOCUMENT;
    return asset_type.OTHER;
  }

  /**
   * Enrich asset with resolved URL
   */
  public enrichAssetUrl(asset: Asset): AssetWithUrl {
    let url: string;
    if (asset.access_type === asset_access_type.PUBLIC) {
      const cleanPath = asset.path.startsWith('public/')
        ? asset.path.replace('public/', '')
        : asset.path;
      url = `${this.cdnUrl}/${cleanPath}`;
    } else {
      url = `/api/v1/assets/private/${asset.id}/stream`;
    }
    return {
      ...asset,
      url,
      metadata: asset.metadata as Record<string, unknown>,
    };
  }
}
