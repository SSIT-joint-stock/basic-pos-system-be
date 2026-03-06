import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { storageConfig } from 'app/config';

/**
 * Validates uploaded files against configurable MIME types and size limits.
 */
@Injectable()
export class FileValidatorService {
  private readonly logger = new Logger(FileValidatorService.name);
  private readonly maxSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    @Inject(storageConfig.KEY)
    private readonly config: ConfigType<typeof storageConfig>,
  ) {
    this.maxSize = config.maxFileSize;
    this.allowedMimeTypes = config.allowedMimeTypes;
  }

  /**
   * Validate MIME type and size for standard uploads.
   */
  validateFile(file: Express.Multer.File): void {
    this.checkSize(file);
    this.checkMimeType(file, this.allowedMimeTypes);
    this.logger.debug(
      `File valid: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
    );
  }

  /**
   * Validate for feedback uploads (images & videos only).
   */
  validateFeedbackFile(file: Express.Multer.File): void {
    this.checkSize(file);
    this.checkMimeType(file, [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
    ]);
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private checkSize(file: Express.Multer.File): void {
    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds the maximum allowed size of ${this.maxSize} bytes`,
      );
    }
  }

  private checkMimeType(
    file: Express.Multer.File,
    allowedTypes: string[],
  ): void {
    const isAllowed = allowedTypes.includes(file.mimetype);
    if (!isAllowed) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }
}
