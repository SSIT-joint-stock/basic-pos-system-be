import { Readable } from 'stream';

/**
 * Abstract interface for storage drivers.
 * New drivers (e.g. S3) must implement this contract.
 */
export interface SaveResult {
  /** Relative path from storage root (e.g. "public/2024/01/filename.jpg") */
  path: string;
  /** Actual bytes saved */
  size: number;
}

export interface IStorageService {
  /**
   * Save a file to storage.
   * @param file - Multer file object (memory storage)
   * @param folder - Relative sub-folder (e.g. "2024/01/products")
   * @param filename - Final filename to use
   * @param accessType - 'PUBLIC' | 'PRIVATE' | 'TEMP'
   */
  save(
    file: Express.Multer.File,
    folder: string,
    filename: string,
    accessType: 'PUBLIC' | 'PRIVATE' | 'TEMP',
  ): Promise<SaveResult>;

  /**
   * Delete a file by its relative path.
   * @param relativePath - Path relative to storage root
   */
  delete(relativePath: string): Promise<void>;

  /**
   * Get a readable stream for a file.
   * @param relativePath - Path relative to storage root
   */
  getStream(relativePath: string): Promise<Readable>;
}
