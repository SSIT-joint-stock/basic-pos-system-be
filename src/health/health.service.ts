import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import * as fs from 'fs';

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  cpu: {
    model: string;
    cores: number;
    loadAverage: number[];
  };
  disk?: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  process: {
    pid: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface HealthMetrics {
  timestamp: string;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  responseTime: number;
}

@Injectable()
export class HealthService {
  private startTime: Date;
  private responseTimes: number[] = [];

  constructor(private configService: ConfigService) {
    this.startTime = new Date();
  }

  /**
   * Get comprehensive system information
   */
  async getSystemInfo(): Promise<SystemInfo> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const cpus = os.cpus();

    let diskInfo;
    try {
      const diskUsage = await this.getDiskUsage(process.cwd());
      diskInfo = diskUsage;
    } catch (error) {
      console.error(error);
      // Disk info might not be available in some environments
    }

    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercent: Math.round((usedMemory / totalMemory) * 100),
      },
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        loadAverage: os.loadavg(),
      },
      disk: diskInfo,
      process: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  /**
   * Get health metrics for monitoring
   */
  async getMetrics(): Promise<string> {
    const info = await this.getSystemInfo();
    const appName = this.configService.get('APP_NAME', 'basic-pos-system');

    // Prometheus format
    let metrics = `# HELP ${appName}_uptime_seconds Application uptime in seconds\n`;
    metrics += `# TYPE ${appName}_uptime_seconds gauge\n`;
    metrics += `${appName}_uptime_seconds ${info.uptime}\n\n`;

    metrics += `# HELP ${appName}_memory_usage_bytes Memory usage in bytes\n`;
    metrics += `# TYPE ${appName}_memory_usage_bytes gauge\n`;
    metrics += `${appName}_memory_usage_bytes ${info.process.memoryUsage.heapUsed}\n\n`;

    metrics += `# HELP ${appName}_memory_usage_percent Memory usage percentage\n`;
    metrics += `# TYPE ${appName}_memory_usage_percent gauge\n`;
    metrics += `${appName}_memory_usage_percent ${info.memory.usagePercent}\n\n`;

    if (info.disk) {
      metrics += `# HELP ${appName}_disk_usage_percent Disk usage percentage\n`;
      metrics += `# TYPE ${appName}_disk_usage_percent gauge\n`;
      metrics += `${appName}_disk_usage_percent ${info.disk.usagePercent}\n\n`;
    }

    metrics += `# HELP ${appName}_cpu_cores Number of CPU cores\n`;
    metrics += `# TYPE ${appName}_cpu_cores gauge\n`;
    metrics += `${appName}_cpu_cores ${info.cpu.cores}\n\n`;

    return metrics;
  }

  /**
   * Record response time for metrics
   */
  recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  /**
   * Get average response time
   */
  getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.responseTimes.length;
  }

  /**
   * Get application uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Get disk usage information
   */
  private async getDiskUsage(dirPath: string): Promise<{
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  }> {
    return new Promise((resolve, reject) => {
      // For Node.js, we can use fs.statvfs or external libraries
      // For now, we'll return basic filesystem info
      fs.stat(dirPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // This is a simplified version. In production, consider using systeminformation or diskusage packages
        resolve({
          total: 100 * 1024 * 1024 * 1024, // 100GB placeholder
          free: 50 * 1024 * 1024 * 1024, // 50GB placeholder
          used: 50 * 1024 * 1024 * 1024, // 50GB placeholder
          usagePercent: 50, // 50% placeholder
        });
      });
    });
  }

  /**
   * Check if the application is healthy based on various metrics
   */
  async isHealthy(): Promise<boolean> {
    try {
      const info = await this.getSystemInfo();

      // Memory usage should be below 90%
      if (info.memory.usagePercent > 90) {
        return false;
      }

      // Check disk usage if available
      if (info.disk && info.disk.usagePercent > 95) {
        return false;
      }

      // Application should have been running for at least 10 seconds
      if (info.uptime < 10) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
