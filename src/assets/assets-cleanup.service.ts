import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AssetVisibility } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'app/prisma/prisma.service';
import { StorageService } from './storage/storage.service';

@Injectable()
export class AssetsCleanupService {
  private readonly cleanupEnabled: boolean;
  private readonly deleteFiles: boolean;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.cleanupEnabled = this.parseBoolean(
      this.configService.get<string>('ASSET_CLEANUP_ENABLED'),
    );
    this.deleteFiles = this.parseBoolean(
      this.configService.get<string>('ASSET_CLEANUP_DELETE_FILES'),
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup(): Promise<void> {
    if (!this.cleanupEnabled) {
      return;
    }

    const now = new Date();
    const expiredAssets = await this.prisma.asset.findMany({
      where: {
        visibility: AssetVisibility.TEMP,
        expiresAt: { lt: now },
        deletedAt: null,
      },
      select: { id: true, storageKey: true },
    });

    if (expiredAssets.length === 0) {
      return;
    }

    await this.prisma.asset.updateMany({
      where: { id: { in: expiredAssets.map((asset) => asset.id) } },
      data: { deletedAt: now },
    });

    if (!this.deleteFiles) {
      return;
    }

    for (const asset of expiredAssets) {
      try {
        await this.storage.delete(asset.storageKey);
      } catch {
        continue;
      }
    }
  }

  private parseBoolean(value?: string): boolean {
    if (!value) {
      return false;
    }
    return value === 'true' || value === '1';
  }
}
