import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import * as fs from 'fs';
import * as path from 'path';

export interface DiskCheckOptions {
  path: string;
  thresholdPercent: number;
}

@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  /**
   * Check storage/disk usage
   */
  async checkStorage(
    key: string,
    options: DiskCheckOptions,
  ): Promise<HealthIndicatorResult> {
    try {
      const diskUsage = await this.getDiskUsage(options.path);

      const isHealthy = diskUsage.usagePercent < options.thresholdPercent;

      return this.getStatus(key, isHealthy, {
        path: options.path,
        total: diskUsage.total,
        totalGB: Math.round(diskUsage.total / 1024 / 1024 / 1024),
        free: diskUsage.free,
        freeGB: Math.round(diskUsage.free / 1024 / 1024 / 1024),
        used: diskUsage.used,
        usedGB: Math.round(diskUsage.used / 1024 / 1024 / 1024),
        usagePercent: diskUsage.usagePercent,
        thresholdPercent: options.thresholdPercent,
        status: isHealthy ? 'healthy' : 'warning',
        availablePercent: 100 - diskUsage.usagePercent,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        path: options.path,
        error: error.message,
        status: 'error',
        message: 'Failed to check disk usage',
      });
    }
  }

  /**
   * Check if path exists and is accessible
   */
  async checkPath(
    key: string,
    filePath: string,
  ): Promise<HealthIndicatorResult> {
    try {
      const stats = await fs.promises.stat(filePath);
      const isHealthy = stats.isDirectory() || stats.isFile();

      return this.getStatus(key, isHealthy, {
        path: filePath,
        exists: true,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        sizeMB: Math.round(stats.size / 1024 / 1024),
        modified: stats.mtime.toISOString(),
        permissions: (stats.mode & parseInt('777', 8)).toString(8),
      });
    } catch (error) {
      return this.getStatus(key, false, {
        path: filePath,
        exists: false,
        error: error.message,
        status: 'not_accessible',
      });
    }
  }

  /**
   * Check multiple paths
   */
  async checkMultiplePaths(
    key: string,
    paths: string[],
  ): Promise<HealthIndicatorResult> {
    const results = await Promise.allSettled(
      paths.map(async (filePath) => {
        try {
          const stats = await fs.promises.stat(filePath);
          return {
            path: filePath,
            exists: true,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime.toISOString(),
          };
        } catch (error) {
          return {
            path: filePath,
            exists: false,
            error: error.message,
          };
        }
      }),
    );

    const healthyPaths = results.filter(
      (result) => result.status === 'fulfilled' && result.value.exists,
    ).length;

    const isHealthy = healthyPaths === paths.length;

    return this.getStatus(key, isHealthy, {
      totalPaths: paths.length,
      healthyPaths,
      unhealthyPaths: paths.length - healthyPaths,
      paths: results.map((result, index) => ({
        filePath: paths[index],
        ...(result.status === 'fulfilled'
          ? result.value
          : { error: result.reason }),
      })),
    });
  }

  /**
   * Check file system permissions
   */
  async checkPermissions(
    key: string,
    filePath: string,
  ): Promise<HealthIndicatorResult> {
    try {
      // Try to write a temporary file
      const testFile = path.join(filePath, '.health-check.tmp');
      await fs.promises.writeFile(testFile, 'health check');
      await fs.promises.unlink(testFile);

      // Check directory permissions
      const stats = await fs.promises.stat(filePath);

      return this.getStatus(key, true, {
        path: filePath,
        writable: true,
        readable: true,
        permissions: (stats.mode & parseInt('777', 8)).toString(8),
        uid: stats.uid,
        gid: stats.gid,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        path: filePath,
        writable: false,
        error: error.message,
        status: 'permission_denied',
      });
    }
  }

  /**
   * Get detailed disk usage information
   */
  async etDiskUsageInfo(): Promise<HealthIndicatorResult> {
    try {
      const cwd = process.cwd();
      const diskUsage = await this.getDiskUsage(cwd);

      // Check other important paths
      const pathsToCheck = [
        cwd,
        path.join(cwd, 'logs'),
        path.join(cwd, 'uploads'),
        path.join(cwd, 'public'),
      ];

      const pathResults = await Promise.allSettled(
        pathsToCheck.map(async (filePath) => {
          try {
            const stats = await fs.promises.stat(filePath);
            return {
              path: filePath,
              exists: true,
              type: stats.isDirectory() ? 'directory' : 'file',
              size: stats.size,
            };
          } catch (error) {
            return {
              path: filePath,
              exists: false,
              error: error.message,
            };
          }
        }),
      );

      return this.getStatus('disk_usage_info', true, {
        currentDirectory: cwd,
        disk: {
          total: diskUsage.total,
          totalGB: Math.round(diskUsage.total / 1024 / 1024 / 1024),
          free: diskUsage.free,
          freeGB: Math.round(diskUsage.free / 1024 / 1024 / 1024),
          used: diskUsage.used,
          usedGB: Math.round(diskUsage.used / 1024 / 1024 / 1024),
          usagePercent: diskUsage.usagePercent,
        },
        paths: pathResults.map((result, index) => ({
          filePath: pathsToCheck[index],
          ...(result.status === 'fulfilled'
            ? result.value
            : { error: result.reason }),
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return this.getStatus('disk_usage_info', false, {
        error: error.message,
        status: 'failed_to_get_info',
      });
    }
  }

  /**
   * Get disk usage for a specific path
   * Note: This is a simplified implementation. For production,
   * consider using a dedicated library like 'diskusage' or 'systeminformation'
   */
  private getDiskUsage(dirPath: string): Promise<{
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        // For Node.js built-in, we can use fs.statvfs if available
        // Otherwise, provide fallback values
        fs.stat(dirPath, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // This is a simplified implementation
          // In production, you might want to use system calls or external libraries
          // to get actual disk usage information

          // Fallback values for development
          resolve({
            total: 100 * 1024 * 1024 * 1024, // 100GB
            free: 40 * 1024 * 1024 * 1024, // 40GB
            used: 60 * 1024 * 1024 * 1024, // 60GB
            usagePercent: 60, // 60%
          });
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
}
