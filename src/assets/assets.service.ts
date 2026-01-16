import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Asset, AssetAction, AssetVisibility, Prisma } from '@prisma/client';
import { GoneError, UnauthorizedError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';
import { Readable } from 'node:stream';
import { CreateLinkDto } from './dto/create-link.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UploadAssetDto } from './dto/upload-asset.dto';
import { StorageService } from './storage/storage.service';
import { buildAssetUrl, generateStorageKey } from './utils/asset-utils';

export interface AssetResponse {
  id: string;
  visibility: AssetVisibility;
  storageKey: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string | null;
  expiresAt: Date | null;
}

@Injectable()
export class AssetsService {
  private readonly cdnUrl: string;
  private readonly maxUploadSize: number | null;
  private readonly allowedMimeTypes: Set<string> | null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
    private readonly configService: ConfigService,
  ) {
    const cdnUrl = this.configService.get<string>('ASSET_CDN_URL');
    if (!cdnUrl) {
      throw new Error('ASSET_CDN_URL is not configured');
    }
    this.cdnUrl = cdnUrl;

    const maxUploadSize = this.configService.get<number>('MAX_UPLOAD_SIZE');
    this.maxUploadSize =
      typeof maxUploadSize === 'number' && Number.isFinite(maxUploadSize)
        ? maxUploadSize
        : null;

    const allowedTypes = this.configService.get<string>('ALLOWED_MIME_TYPES');
    this.allowedMimeTypes = this.parseAllowedMimeTypes(allowedTypes);
  }

  async uploadAsset(
    file: Express.Multer.File | undefined,
    dto: UploadAssetDto,
    userId: string,
    storeId: string,
  ): Promise<AssetResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    this.validateUploadFile(file);

    const visibility = dto.visibility ?? AssetVisibility.PUBLIC;
    const expiresAt = this.resolveExpiresAt(visibility, dto);
    const storageKey = generateStorageKey(
      storeId,
      visibility,
      file.originalname,
      file.mimetype,
    );

    // Lưu file trước để lấy checksum/size; nếu tạo DB lỗi thì xóa file.
    const { checksum, size } = await this.storage.save(
      storageKey,
      Readable.from(file.buffer),
    );

    try {
      const asset = await this.prisma.asset.create({
        data: {
          storeId,
          visibility,
          storageKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size,
          checksum,
          createdBy: userId,
          expiresAt,
        },
      });

      return this.toAssetResponse(asset);
    } catch (error) {
      await this.storage.delete(storageKey);
      throw error;
    }
  }

  async getAssetInfo(
    id: string,
    storeId: string,
    userId?: string,
  ): Promise<AssetResponse> {
    const asset = await this.getAssetForRead(id, storeId, userId);
    return this.toAssetResponse(asset);
  }

  async getAssetForRead(
    id: string,
    storeId: string,
    userId?: string,
  ): Promise<Asset> {
    const asset = await this.findAssetOrThrow(id, storeId);
    this.ensureNotExpired(asset);

    if (asset.visibility === AssetVisibility.PUBLIC) {
      return asset;
    }

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    if (asset.createdBy === userId) {
      return asset;
    }

    const permission = await this.prisma.assetPermission.findUnique({
      where: {
        storeId_assetId_userId_action: {
          storeId,
          assetId: asset.id,
          userId,
          action: AssetAction.READ,
        },
      },
    });

    if (!permission) {
      throw new ForbiddenException('Access denied');
    }

    return asset;
  }

  async getPublicAsset(id: string, storeId: string): Promise<Asset> {
    const asset = await this.findAssetOrThrow(id, storeId);
    this.ensureNotExpired(asset);

    if (asset.visibility !== AssetVisibility.PUBLIC) {
      throw new NotFoundException('Asset');
    }

    return asset;
  }

  async getDownloadStream(asset: Asset): Promise<Readable> {
    const exists = await this.storage.exists(asset.storageKey);
    if (!exists) {
      throw new NotFoundException('Asset file');
    }

    return this.storage.createReadStream(asset.storageKey);
  }

  async updateVisibility(
    assetId: string,
    storeId: string,
    visibility: AssetVisibility,
    userId: string,
  ): Promise<AssetResponse> {
    const asset = await this.findAssetOrThrow(assetId, storeId);
    await this.ensureWriteAccess(asset, storeId, userId);

    // TEMP không được đổi visibility (cả hiện tại lẫn target).
    if (
      asset.visibility === AssetVisibility.TEMP ||
      visibility === AssetVisibility.TEMP
    ) {
      throw new BadRequestException('TEMP assets cannot change visibility');
    }

    if (asset.visibility === visibility) {
      return this.toAssetResponse(asset);
    }

    const exists = await this.storage.exists(asset.storageKey);
    if (!exists) {
      throw new NotFoundException('Asset file');
    }

    const newStorageKey = generateStorageKey(
      storeId,
      visibility,
      asset.originalName,
      asset.mimeType,
    );

    // Di chuyển file trước, nếu update DB lỗi thì rollback về key cũ.
    await this.storage.move(asset.storageKey, newStorageKey);

    try {
      const updated = await this.prisma.asset.update({
        where: { id: asset.id },
        data: {
          visibility,
          storageKey: newStorageKey,
        },
      });

      return this.toAssetResponse(updated);
    } catch (error) {
      await this.storage
        .move(newStorageKey, asset.storageKey)
        .catch(() => undefined);
      throw error;
    }
  }

  async deleteAsset(
    assetId: string,
    storeId: string,
    userId: string,
  ): Promise<AssetResponse> {
    const asset = await this.findAssetOrThrow(assetId, storeId);
    await this.ensureDeleteAccess(asset, storeId, userId);

    // Soft delete DB trước, sau đó xóa file vật lý.
    const deletedAt = new Date();
    const updated = await this.prisma.asset.update({
      where: { id: asset.id },
      data: { deletedAt },
    });

    await this.storage.delete(asset.storageKey);

    return this.toAssetResponse(updated);
  }

  async grantPermissions(
    assetId: string,
    storeId: string,
    dto: CreatePermissionDto,
    userId: string,
  ) {
    const asset = await this.findAssetOrThrow(assetId, storeId);
    this.ensureUploader(asset, userId);

    const actions = this.uniqueActions(dto.actions);
    await this.prisma.assetPermission.createMany({
      data: actions.map((action) => ({
        storeId,
        assetId: asset.id,
        userId: dto.userId,
        action,
      })),
      skipDuplicates: true,
    });

    return this.prisma.assetPermission.findMany({
      where: {
        storeId,
        assetId: asset.id,
        userId: dto.userId,
      },
    });
  }

  async revokePermissions(
    assetId: string,
    storeId: string,
    dto: CreatePermissionDto,
    userId: string,
  ) {
    const asset = await this.findAssetOrThrow(assetId, storeId);
    this.ensureUploader(asset, userId);

    const actions = this.uniqueActions(dto.actions);
    await this.prisma.assetPermission.deleteMany({
      where: {
        storeId,
        assetId: asset.id,
        userId: dto.userId,
        action: {
          in: actions,
        },
      },
    });

    return this.prisma.assetPermission.findMany({
      where: {
        storeId,
        assetId: asset.id,
        userId: dto.userId,
      },
    });
  }

  async attachLink(
    assetId: string,
    storeId: string,
    dto: CreateLinkDto,
    userId: string,
  ) {
    const asset = await this.findAssetOrThrow(assetId, storeId);
    await this.ensureWriteAccess(asset, storeId, userId);

    return this.prisma.assetLink.create({
      data: {
        storeId,
        assetId: asset.id,
        entityType: dto.entityType,
        entityId: dto.entityId,
        field: dto.field ?? null,
      },
    });
  }

  async listByEntity(
    storeId: string,
    entityType: string,
    entityId: string,
    query: Prisma.AssetFindManyArgs,
    userId?: string,
  ): Promise<{ data: AssetResponse[]; total: number }> {
    const now = new Date();
    const where: Prisma.AssetWhereInput = {
      storeId,
      deletedAt: null,
      links: {
        some: {
          storeId,
          entityType,
          entityId,
        },
      },
    };

    // Không có user thì chỉ lấy PUBLIC.
    if (!userId) {
      where.visibility = AssetVisibility.PUBLIC;
    } else {
      const readAccessFilter: Prisma.AssetWhereInput = {
        OR: [
          { createdBy: userId },
          {
            permissions: {
              some: {
                storeId,
                userId,
                action: AssetAction.READ,
              },
            },
          },
        ],
      };

      where.OR = [
        { visibility: AssetVisibility.PUBLIC },
        {
          visibility: AssetVisibility.PRIVATE,
          AND: [readAccessFilter],
        },
        {
          visibility: AssetVisibility.TEMP,
          AND: [
            readAccessFilter,
            {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          ],
        },
      ];
    }

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { data: assets.map((asset) => this.toAssetResponse(asset)), total };
  }

  async listCreatedAssets(
    userId: string,
    storeId: string,
    query: Prisma.AssetFindManyArgs,
  ): Promise<{ data: AssetResponse[]; total: number }> {
    const where: Prisma.AssetWhereInput = {
      AND: [
        { createdBy: userId },
        { storeId },
        { deletedAt: null },
        query.where ?? {},
      ],
    };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { data: assets.map((asset) => this.toAssetResponse(asset)), total };
  }

  private async findAssetOrThrow(
    assetId: string,
    storeId: string,
  ): Promise<Asset> {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, storeId },
    });

    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Asset');
    }

    return asset;
  }

  private ensureNotExpired(asset: Asset): void {
    if (
      asset.visibility === AssetVisibility.TEMP &&
      asset.expiresAt &&
      asset.expiresAt.getTime() < Date.now()
    ) {
      throw new GoneError('Asset has expired', 'ASSET_EXPIRED');
    }
  }

  private ensureUploader(asset: Asset, userId: string): void {
    if (asset.createdBy !== userId) {
      throw new ForbiddenException('Only uploader can manage permissions');
    }
  }

  private async ensureWriteAccess(
    asset: Asset,
    storeId: string,
    userId: string,
  ): Promise<void> {
    if (asset.createdBy === userId) {
      return;
    }

    const permission = await this.prisma.assetPermission.findUnique({
      where: {
        storeId_assetId_userId_action: {
          storeId,
          assetId: asset.id,
          userId,
          action: AssetAction.WRITE,
        },
      },
    });

    if (!permission) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async ensureDeleteAccess(
    asset: Asset,
    storeId: string,
    userId: string,
  ): Promise<void> {
    if (asset.createdBy === userId) {
      return;
    }

    const permission = await this.prisma.assetPermission.findUnique({
      where: {
        storeId_assetId_userId_action: {
          storeId,
          assetId: asset.id,
          userId,
          action: AssetAction.DELETE,
        },
      },
    });

    if (!permission) {
      throw new ForbiddenException('Access denied');
    }
  }

  private toAssetResponse(asset: Asset): AssetResponse {
    return {
      id: asset.id,
      visibility: asset.visibility,
      storageKey: asset.storageKey,
      url: buildAssetUrl(this.cdnUrl, asset.storageKey),
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
      checksum: asset.checksum,
      expiresAt: asset.expiresAt,
    };
  }

  private validateUploadFile(file: Express.Multer.File): void {
    if (this.maxUploadSize && file.size > this.maxUploadSize) {
      throw new BadRequestException('File size exceeds maximum limit');
    }

    if (this.allowedMimeTypes) {
      const mimeType = file.mimetype.toLowerCase();
      if (!this.allowedMimeTypes.has(mimeType)) {
        throw new BadRequestException('File type is not allowed');
      }
    }
  }

  private resolveExpiresAt(
    visibility: AssetVisibility,
    dto: UploadAssetDto,
  ): Date | null {
    if (visibility !== AssetVisibility.TEMP) {
      return null;
    }

    const now = new Date();

    if (dto.expiresAt) {
      const expiresAt = new Date(dto.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) {
        throw new BadRequestException('expiresAt must be a valid ISO date');
      }
      if (expiresAt.getTime() <= now.getTime()) {
        throw new BadRequestException('expiresAt must be in the future');
      }
      return expiresAt;
    }

    const expiresInSeconds = dto.expiresInSeconds ?? 3600;
    if (expiresInSeconds <= 0) {
      throw new BadRequestException(
        'expiresInSeconds must be greater than zero',
      );
    }

    return new Date(now.getTime() + expiresInSeconds * 1000);
  }

  private parseAllowedMimeTypes(raw: string | undefined): Set<string> | null {
    if (!raw) {
      return null;
    }

    const items = raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);

    if (items.length === 0) {
      return null;
    }

    return new Set(items);
  }

  private uniqueActions(actions: AssetAction[]): AssetAction[] {
    return Array.from(new Set(actions));
  }
}
