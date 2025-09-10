import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import * as os from 'os';
import * as process from 'process';

@Injectable()
export class SystemHealthIndicator extends HealthIndicator {
  /**
   * Check basic system health
   */
  checkSystem(): HealthIndicatorResult {
    try {
      const uptime = os.uptime();
      const loadAverage = os.loadavg();
      const cpuCount = os.cpus().length;

      // System is healthy if:
      // 1. Uptime > 10 seconds
      // 2. Load average is reasonable (< cpuCount * 2)
      // 3. Memory usage < 95%

      const memoryUsagePercent =
        ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
      const isHealthy =
        uptime > 10 && loadAverage[0] < cpuCount * 2 && memoryUsagePercent < 95;

      return this.getStatus('system', isHealthy, {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: Math.round(uptime),
        uptimeFormatted: this.formatUptime(uptime),
        loadAverage: loadAverage.map((load) => Math.round(load * 100) / 100),
        cpuCount,
        memory: {
          total: os.totalmem(),
          totalGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
          free: os.freemem(),
          freeGB: Math.round(os.freemem() / 1024 / 1024 / 1024),
          used: os.totalmem() - os.freemem(),
          usedGB: Math.round(
            (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024,
          ),
          usagePercent: Math.round(memoryUsagePercent),
        },
        nodeVersion: process.version,
        pid: process.pid,
        status: isHealthy ? 'healthy' : 'degraded',
      });
    } catch (error) {
      return this.getStatus('system', false, {
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'error',
      });
    }
  }

  /**
   * Check CPU load
   */
  checkCpuLoad(key: string, threshold: number = 2): HealthIndicatorResult {
    try {
      const loadAverage = os.loadavg();
      const cpuCount = os.cpus().length;

      // Load average should be less than (cpuCount * threshold)
      const maxLoad = cpuCount * threshold;
      const isHealthy = loadAverage[0] < maxLoad;

      return this.getStatus(key, isHealthy, {
        loadAverage: loadAverage.map((load) => Math.round(load * 100) / 100),
        cpuCount,
        maxLoad,
        threshold,
        status: isHealthy ? 'normal' : 'high_load',
        loadPercent: Math.round((loadAverage[0] / cpuCount) * 100),
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        status: 'error',
      });
    }
  }

  /**
   * Check system uptime
   */
  checkUptime(
    key: string,
    minUptimeSeconds: number = 60,
  ): HealthIndicatorResult {
    try {
      const uptime = os.uptime();
      const isHealthy = uptime >= minUptimeSeconds;

      return this.getStatus(key, isHealthy, {
        uptime: Math.round(uptime),
        uptimeFormatted: this.formatUptime(uptime),
        minUptimeSeconds,
        status: isHealthy ? 'stable' : 'recently_started',
        uptimeHours: Math.round(uptime / 3600),
        uptimeDays: Math.round(uptime / 86400),
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        status: 'error',
      });
    }
  }

  /**
   * Check Node.js process health
   */
  checkProcess(key: string): HealthIndicatorResult {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Check if process memory is reasonable (< 500MB heap used)
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const isHealthy = heapUsedMB < 500; // 500MB threshold

      return this.getStatus(key, isHealthy, {
        pid: process.pid,
        uptime: Math.round(process.uptime()),
        uptimeFormatted: this.formatUptime(process.uptime()),
        memory: {
          rss: memUsage.rss,
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: memUsage.heapTotal,
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: memUsage.heapUsed,
          heapUsedMB: Math.round(heapUsedMB),
          external: memUsage.external,
          externalMB: Math.round(memUsage.external / 1024 / 1024),
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          total: cpuUsage.user + cpuUsage.system,
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        status: isHealthy ? 'healthy' : 'high_memory_usage',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        status: 'error',
      });
    }
  }

  /**
   * Check environment variables
   */
  checkEnvironment(key: string, requiredVars: string[]): HealthIndicatorResult {
    try {
      const missingVars: string[] = [];
      const presentVars: string[] = [];

      for (const varName of requiredVars) {
        if (process.env[varName]) {
          presentVars.push(varName);
        } else {
          missingVars.push(varName);
        }
      }

      const isHealthy = missingVars.length === 0;

      return this.getStatus(key, isHealthy, {
        requiredVars,
        presentVars,
        missingVars,
        totalRequired: requiredVars.length,
        presentCount: presentVars.length,
        missingCount: missingVars.length,
        status: isHealthy ? 'complete' : 'incomplete',
        coveragePercent: Math.round(
          (presentVars.length / requiredVars.length) * 100,
        ),
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        status: 'error',
      });
    }
  }

  /**
   * Get comprehensive system information
   */
  getSystemInfo(): HealthIndicatorResult {
    try {
      const cpus = os.cpus();
      const networkInterfaces = os.networkInterfaces();

      return this.getStatus('system_info', true, {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        type: os.type(),
        release: os.release(),
        uptime: Math.round(os.uptime()),
        uptimeFormatted: this.formatUptime(os.uptime()),
        loadAverage: os.loadavg().map((load) => Math.round(load * 100) / 100),
        cpus: cpus.map((cpu, index) => ({
          id: index,
          model: cpu.model,
          speed: cpu.speed,
          times: cpu.times,
        })),
        memory: {
          total: os.totalmem(),
          totalGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
          free: os.freemem(),
          freeGB: Math.round(os.freemem() / 1024 / 1024 / 1024),
          used: os.totalmem() - os.freemem(),
          usedGB: Math.round(
            (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024,
          ),
          usagePercent: Math.round(
            ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
          ),
        },
        network: Object.entries(networkInterfaces).reduce(
          (acc, [name, interfaces]) => {
            if (interfaces) {
              acc[name] = interfaces.map((iface) => ({
                address: iface.address,
                netmask: iface.netmask,
                family: iface.family,
                mac: iface.mac,
                internal: iface.internal,
              }));
            }
            return acc;
          },
          {} as any,
        ),
        process: {
          pid: process.pid,
          ppid: process.ppid,
          version: process.version,
          versions: process.versions,
          arch: process.arch,
          platform: process.platform,
          uptime: Math.round(process.uptime()),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: Intl.DateTimeFormat().resolvedOptions().locale,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return this.getStatus('system_info', false, {
        error: error.message,
        status: 'failed_to_get_info',
      });
    }
  }

  /**
   * Format uptime seconds into human readable format
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts: string[] = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0)
      parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }
}
