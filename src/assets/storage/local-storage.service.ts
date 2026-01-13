import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, unlink } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { BadRequestError } from 'app/common/response';
import { StorageSaveResult, StorageService } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly rootDir: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.rootDir =
      this.configService.get<string>('STORAGE_ROOT_DIR') ?? '/app/storage';
  }

  async save(storageKey: string, stream: Readable): Promise<StorageSaveResult> {
    const filePath = this.resolvePath(storageKey);
    await mkdir(dirname(filePath), { recursive: true });

    const hash = createHash('sha256');
    let size = 0;
    const hashStream = new Transform({
      transform(chunk, _encoding, callback) {
        hash.update(chunk);
        size += chunk.length;
        callback(null, chunk);
      },
    });

    await pipeline(stream, hashStream, createWriteStream(filePath));

    return { checksum: hash.digest('hex'), size };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async createReadStream(storageKey: string): Promise<Readable> {
    const filePath = this.resolvePath(storageKey);
    return createReadStream(filePath);
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = this.resolvePath(storageKey);
    try {
      await unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const filePath = this.resolvePath(storageKey);
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private resolvePath(storageKey: string): string {
    const root = resolve(this.rootDir);
    const normalizedKey = storageKey.replace(/^\/+/, '');
    const fullPath = resolve(root, normalizedKey);
    const rootWithSep = root.endsWith(sep) ? root : `${root}${sep}`;

    if (fullPath !== root && !fullPath.startsWith(rootWithSep)) {
      throw new BadRequestError('Invalid storage key');
    }

    return fullPath;
  }
}
