import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from 'app/module/auth/auth.module';
import { JwtAuthGuard } from 'app/module/auth/guards/jwt-auth.guard';
import { PrismaService } from 'app/prisma/prisma.service';
import { memoryStorage } from 'multer';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { FileValidatorService } from './services/file-validator.service';
import { LocalStorageService } from './services/local-storage.service';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [AssetsController],
  providers: [
    PrismaService,
    JwtAuthGuard,
    AssetsService,
    FileValidatorService,
    {
      provide: 'IStorageService',
      useClass: LocalStorageService,
    },
  ],
  exports: [AssetsService],
})
export class AssetsModule {}
