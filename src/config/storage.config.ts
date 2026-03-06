import { registerAs } from '@nestjs/config';

/**
 * Storage & Asset configuration
 * Reads from environment variables (validated by Zod in env.validation.ts)
 */
export default registerAs('storage', () => ({
  driver: process.env.STORAGE_DRIVER ?? 'local',
  rootDir: process.env.STORAGE_ROOT_DIR ?? '/app/storage',
  publicDirName: process.env.STORAGE_PUBLIC_DIR_NAME ?? 'public',
  privateDirName: process.env.STORAGE_PRIVATE_DIR_NAME ?? 'private',
  tempDirName: process.env.STORAGE_TEMP_DIR_NAME ?? 'temp',
  cdnUrl: (process.env.ASSET_CDN_URL ?? 'http://localhost:3000/cdn').replace(
    /\/$/,
    '',
  ),
  maxFileSize: parseInt(process.env.ASSET_MAX_FILE_SIZE ?? '10485760', 10),
  allowedMimeTypes: (
    process.env.ASSET_ALLOWED_MIME_TYPES ??
    'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/quicktime,audio/mpeg,audio/wav,application/pdf'
  ).split(','),
}));
