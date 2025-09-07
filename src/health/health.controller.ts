import { Controller, Get, Header } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiSuccess, RawResponse } from 'common/decorators';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { DiskHealthIndicator } from './indicators/disk.health';
import { SystemHealthIndicator } from './indicators/system.health';
import { NotFoundError } from 'app/common/response';

@Controller('health')
export class HealthController {
  private isProduction: boolean;
  private healthEndpointsEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private health: HealthCheckService,
    private healthService: HealthService,
    private db: DatabaseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private system: SystemHealthIndicator,
  ) {
    // Check if we're in production environment
    this.isProduction = this.configService.get('NODE_ENV') === 'production';

    // Check if detailed health endpoints are enabled (default: false in production)
    this.healthEndpointsEnabled =
      this.configService.get('HEALTH_ENDPOINTS_ENABLED', 'false') === 'true';
  }

  /**
   * Check if health endpoints are allowed to be accessed
   */
  private isHealthEndpointAllowed(): boolean {
    // Always allow in development
    if (!this.isProduction) return true;

    // In production, only allow if explicitly enabled
    return this.healthEndpointsEnabled;
  }

  /**
   * Basic health check - checks if the application is running
   * Only available when HEALTH_ENDPOINTS_ENABLED=true or in development
   */
  @Get()
  @ApiSuccess('Application is healthy')
  @HealthCheck()
  check() {
    if (!this.isHealthEndpointAllowed()) {
      throw new NotFoundError('Health endpoint not available in production');
    }
    return this.health.check([
      () => this.system.checkSystem(),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024), // 150MB
    ]);
  }

  /**
   * Comprehensive health check including database and disk
   * Only available when HEALTH_ENDPOINTS_ENABLED=true or in development
   */
  @Get('detailed')
  @ApiSuccess('Detailed health check completed')
  @HealthCheck()
  checkDetailed() {
    if (!this.isHealthEndpointAllowed()) {
      throw new NotFoundError('Health endpoint not available in production');
    }
    return this.health.check([
      () => this.system.checkSystem(),
      () => this.db.isHealthy('database'),
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () => this.memory.checkRSS('memory_rss', 200 * 1024 * 1024), // 200MB
      () =>
        this.disk.checkStorage('storage', {
          path: process.cwd(),
          thresholdPercent: 90, // Alert if disk usage > 90%
        }),
    ]);
  }

  /**
   * Database-only health check
   * Only available when HEALTH_ENDPOINTS_ENABLED=true or in development
   */
  @Get('database')
  @ApiSuccess('Database connection is healthy')
  @HealthCheck()
  checkDatabase() {
    if (!this.isHealthEndpointAllowed()) {
      throw new NotFoundError('Health endpoint not available in production');
    }
    return this.health.check([() => this.db.isHealthy('database')]);
  }

  /**
   * Memory usage health check
   * Only available when HEALTH_ENDPOINTS_ENABLED=true or in development
   */
  @Get('memory')
  @ApiSuccess('Memory usage is within limits')
  @HealthCheck()
  checkMemory() {
    if (!this.isHealthEndpointAllowed()) {
      throw new NotFoundError('Health endpoint not available in production');
    }
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 200 * 1024 * 1024),
    ]);
  }

  /**
   * System information and metrics
   * Only available when HEALTH_ENDPOINTS_ENABLED=true or in development
   */
  @Get('system')
  @RawResponse()
  async getSystemInfo() {
    if (!this.isHealthEndpointAllowed()) {
      throw new NotFoundError('Health endpoint not available in production');
    }
    return this.healthService.getSystemInfo();
  }

  /**
   * Readiness probe - checks if app is ready to serve traffic
   * Only available when HEALTH_ENDPOINTS_ENABLED=true or in development
   */
  @Get('ready')
  @ApiSuccess('Application is ready to serve traffic')
  @HealthCheck()
  checkReadiness() {
    if (!this.isHealthEndpointAllowed()) {
      throw new NotFoundError('Health endpoint not available in production');
    }
    return this.health.check([
      () => this.system.checkSystem(),
      () => this.db.isHealthy('database'),
    ]);
  }

  /**
   * Liveness probe - checks if app is running and responsive
   * ALWAYS available (critical for production monitoring)
   */
  @Get('live')
  @ApiSuccess('Application is alive and responsive')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([() => this.system.checkSystem()]);
  }

  /**
   * Prometheus metrics endpoint (for monitoring)
   * Only available when HEALTH_ENDPOINTS_ENABLED=true or in development
   */
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @RawResponse()
  async getMetrics() {
    if (!this.isHealthEndpointAllowed()) {
      throw new NotFoundError('Health metrics not available in production');
    }
    return this.healthService.getMetrics();
  }
}
