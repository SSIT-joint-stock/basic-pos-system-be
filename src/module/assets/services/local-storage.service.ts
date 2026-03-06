import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { storageConfig } from 'app/config';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import type { IStorageService, SaveResult } from './storage.interface';

/**
 * Local filesystem storage driver.
 * Organizes files under:
 *   {STORAGE_ROOT_DIR}/{public|private|temp}/{folder}/{filename}
 */
@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly rootDir: string;
  private readonly publicDir: string;
  private readonly privateDir: string;
  private readonly tempDir: string;

  constructor(
    @Inject(storageConfig.KEY)
    private readonly config: ConfigType<typeof storageConfig>,
  ) {
    this.rootDir = config.rootDir;
    this.publicDir = path.join(this.rootDir, config.publicDirName);
    this.privateDir = path.join(this.rootDir, config.privateDirName);
    this.tempDir = path.join(this.rootDir, config.tempDirName);

    // Ensure all storage directories exist on startup
    this.ensureDirectories();
  }

  save(
    file: Express.Multer.File,
    folder: string,
    filename: string,
    accessType: 'PUBLIC' | 'PRIVATE' | 'TEMP',
  ): Promise<SaveResult> {
    const baseDir = this.getBaseDir(accessType);
    const targetDir = path.join(baseDir, folder);

    // Ensure target directory exists
    fs.mkdirSync(targetDir, { recursive: true });

    const absolutePath = path.join(targetDir, filename);
    fs.writeFileSync(absolutePath, file.buffer);

    // Return path relative to rootDir  (e.g. "public/2024/01/file.jpg")
    const relativePath = path.relative(this.rootDir, absolutePath);
    const actualSize = fs.statSync(absolutePath).size;

    this.logger.debug(`Saved file: ${relativePath} (${actualSize} bytes)`);
    return Promise.resolve({ path: relativePath, size: actualSize });
  }

  delete(relativePath: string): Promise<void> {
    const absolutePath = path.join(this.rootDir, relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      this.logger.debug(`Deleted file: ${relativePath}`);
    } else {
      this.logger.warn(`File not found for deletion: ${relativePath}`);
    }
    return Promise.resolve();
  }

  getStream(relativePath: string): Promise<Readable> {
    const absolutePath = path.join(this.rootDir, relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(`File not found: ${relativePath}`);
    }
    return Promise.resolve(fs.createReadStream(absolutePath));
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private getBaseDir(accessType: 'PUBLIC' | 'PRIVATE' | 'TEMP'): string {
    switch (accessType) {
      case 'PUBLIC':
        return this.publicDir;
      case 'PRIVATE':
        return this.privateDir;
      case 'TEMP':
        return this.tempDir;
    }
  }

  private ensureDirectories(): void {
    for (const dir of [this.publicDir, this.privateDir, this.tempDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created storage directory: ${dir}`);
      }
    }
  }
}
