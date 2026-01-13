import { Readable } from 'node:stream';

export interface StorageSaveResult {
  checksum: string;
  size: number;
}

export abstract class StorageService {
  abstract save(
    storageKey: string,
    stream: Readable,
  ): Promise<StorageSaveResult>;
  abstract createReadStream(storageKey: string): Promise<Readable>;
  abstract delete(storageKey: string): Promise<void>;
  abstract exists(storageKey: string): Promise<boolean>;
}
