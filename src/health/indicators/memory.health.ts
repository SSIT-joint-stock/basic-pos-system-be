import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import * as os from 'os';
import * as v8 from 'v8';

@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  /**
   * Check heap memory usage
   */
  checkHeap(key: string, heapUsedThreshold: number): HealthIndicatorResult {
    const memUsage = process.memoryUsage();

    const isHealthy = memUsage.heapUsed < heapUsedThreshold;

    return this.getStatus(key, isHealthy, {
      heapUsed: memUsage.heapUsed,
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: memUsage.heapTotal,
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: memUsage.external,
      externalMB: Math.round(memUsage.external / 1024 / 1024),
      threshold: heapUsedThreshold,
      thresholdMB: Math.round(heapUsedThreshold / 1024 / 1024),
      usagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    });
  }

  /**
   * Check RSS (Resident Set Size) memory usage
   */
  checkRSS(key: string, rssThreshold: number): HealthIndicatorResult {
    const memUsage = process.memoryUsage();

    const isHealthy = memUsage.rss < rssThreshold;

    return this.getStatus(key, isHealthy, {
      rss: memUsage.rss,
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      threshold: rssThreshold,
      thresholdMB: Math.round(rssThreshold / 1024 / 1024),
      usagePercent: Math.round((memUsage.rss / os.totalmem()) * 100),
      systemTotal: os.totalmem(),
      systemTotalGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      systemFree: os.freemem(),
      systemFreeGB: Math.round(os.freemem() / 1024 / 1024 / 1024),
      systemUsedPercent: Math.round(
        ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      ),
    });
  }

  /**
   * Check V8 heap statistics
   */
  checkV8Heap(key: string): HealthIndicatorResult {
    try {
      const heapStats = v8.getHeapStatistics();

      // Check if heap usage is within reasonable limits
      const heapUsedPercent =
        (heapStats.used_heap_size / heapStats.heap_size_limit) * 100;
      const isHealthy = heapUsedPercent < 90; // Alert if > 90% of heap limit

      return this.getStatus(key, isHealthy, {
        totalHeapSize: heapStats.total_heap_size,
        totalHeapSizeMB: Math.round(heapStats.total_heap_size / 1024 / 1024),
        usedHeapSize: heapStats.used_heap_size,
        usedHeapSizeMB: Math.round(heapStats.used_heap_size / 1024 / 1024),
        heapSizeLimit: heapStats.heap_size_limit,
        heapSizeLimitMB: Math.round(heapStats.heap_size_limit / 1024 / 1024),
        heapSizeLimitGB: Math.round(
          heapStats.heap_size_limit / 1024 / 1024 / 1024,
        ),
        physicalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
        usedPercent: Math.round(heapUsedPercent),
        mallocedMemory: heapStats.malloced_memory,
        mallocedMemoryMB: Math.round(heapStats.malloced_memory / 1024 / 1024),
        peakMallocedMemory: heapStats.peak_malloced_memory,
        peakMallocedMemoryMB: Math.round(
          heapStats.peak_malloced_memory / 1024 / 1024,
        ),
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: 'Failed to get V8 heap statistics',
        message: error.message,
      });
    }
  }

  /**
   * Get detailed memory information
   */
  getMemoryInfo(): HealthIndicatorResult {
    const memUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    };

    return this.getStatus('memory_info', true, {
      process: {
        rss: memUsage.rss,
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: memUsage.heapTotal,
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: memUsage.heapUsed,
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: memUsage.external,
        externalMB: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: memUsage.arrayBuffers || 0,
        arrayBuffersMB: Math.round((memUsage.arrayBuffers || 0) / 1024 / 1024),
      },
      system: {
        total: systemMemory.total,
        totalGB: Math.round(systemMemory.total / 1024 / 1024 / 1024),
        free: systemMemory.free,
        freeGB: Math.round(systemMemory.free / 1024 / 1024 / 1024),
        used: systemMemory.used,
        usedGB: Math.round(systemMemory.used / 1024 / 1024 / 1024),
        usagePercent: Math.round(
          (systemMemory.used / systemMemory.total) * 100,
        ),
      },
      heapUsagePercent: Math.round(
        (memUsage.heapUsed / memUsage.heapTotal) * 100,
      ),
      processMemoryPercent: Math.round(
        (memUsage.rss / systemMemory.total) * 100,
      ),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check for memory leaks (simplified)
   */
  checkMemoryLeaks(key: string): HealthIndicatorResult {
    const memUsage = process.memoryUsage();

    // Simple heuristic: if heap used is consistently high
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // Consider it a potential memory leak if heap usage > 80%
    const isHealthy = heapUsagePercent < 80;

    return this.getStatus(key, isHealthy, {
      heapUsagePercent: Math.round(heapUsagePercent),
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      externalMB: Math.round(memUsage.external / 1024 / 1024),
      status: isHealthy ? 'normal' : 'high_usage',
      recommendation: isHealthy
        ? 'Memory usage is within normal limits'
        : 'Consider monitoring memory usage and checking for potential memory leaks',
      timestamp: new Date().toISOString(),
    });
  }
}
