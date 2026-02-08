import { AssetsService } from './assets.service';
import { Module } from '@nestjs/common';
import { AuthModule } from 'app/module/auth/auth.module';
import { AssetsController } from './assets.controller';
import { AssetsCleanupService } from './assets-cleanup.service';
import { AssetAccessGuard } from './guards/asset-access.guard';
import { LocalStorageService } from './storage/local-storage.service';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [AuthModule],
  controllers: [AssetsController],
  providers: [
    AssetsService,
    AssetsCleanupService,
    LocalStorageService,
    {
      provide: StorageService,
      useExisting: LocalStorageService,
    },
    AssetAccessGuard,
  ],
})
export class AssetsModule {}
