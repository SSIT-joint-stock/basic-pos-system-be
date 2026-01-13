import { AssetVisibility } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/json': 'json',
  'application/zip': 'zip',
};

export function getVisibilityFolder(visibility: AssetVisibility): string {
  switch (visibility) {
    case AssetVisibility.PRIVATE:
      return 'private';
    case AssetVisibility.TEMP:
      return 'temp';
    case AssetVisibility.PUBLIC:
    default:
      return 'public';
  }
}

export function getSafeExtension(
  originalName: string,
  mimeType: string,
): string {
  const nameExt = extname(originalName).replace('.', '').toLowerCase();
  if (nameExt && /^[a-z0-9]{1,10}$/.test(nameExt)) {
    return nameExt;
  }

  const mimeExt = MIME_EXTENSION_MAP[mimeType.toLowerCase()];
  if (mimeExt) {
    return mimeExt;
  }

  return 'bin';
}

export function generateStorageKey(
  visibility: AssetVisibility,
  originalName: string,
  mimeType: string,
  now: Date = new Date(),
): string {
  const folder = getVisibilityFolder(visibility);
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const extension = getSafeExtension(originalName, mimeType);
  const fileId = randomUUID();

  return `${folder}/${year}/${month}/${fileId}.${extension}`;
}

export function buildAssetUrl(cdnUrl: string, storageKey: string): string {
  const normalized = cdnUrl.replace(/\/+$/, '');
  return `${normalized}/${storageKey}`;
}

export function sanitizeFilename(name: string): string {
  const baseName = basename(name || 'file');
  return baseName.replace(/["\\\r\n]/g, '_');
}
