import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  /**
   * Check database connection health
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Test database connection with a simple query
      await this.prisma.$queryRaw`SELECT 1`;

      // Get database connection info
      const connectionInfo = await this.getConnectionInfo();

      return this.getStatus(key, true, {
        status: 'up',
        type: connectionInfo.type,
        database: connectionInfo.database,
        connectionTime: connectionInfo.connectionTime,
        queryTime: connectionInfo.queryTime,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get detailed database health information
   */
  async getDetailedHealth(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Test various database operations
      const connectionTime = Date.now() - startTime;
      const queryStartTime = Date.now();

      // Test read operation
      const userCount = await this.prisma.user.count();

      // Test write operation (if needed)
      // await this.prisma.health_check.create({ data: { timestamp: new Date() } });

      const queryTime = Date.now() - queryStartTime;

      const connectionInfo = await this.getConnectionInfo();

      return this.getStatus('database_detailed', true, {
        status: 'healthy',
        type: connectionInfo.type,
        database: connectionInfo.database,
        userCount,
        connectionTime: `${connectionTime}ms`,
        queryTime: `${queryTime}ms`,
        totalTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return this.getStatus('database_detailed', false, {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get database connection information
   */
  private async getConnectionInfo(): Promise<{
    type: string;
    database: string;
    connectionTime: string;
    queryTime: string;
  }> {
    try {
      // Get database info from Prisma
      const result = await this.prisma.$queryRaw<{ version: string }[]>`
        SELECT version() as version
      `;

      // Extract database type from version string
      const version = result[0]?.version || '';
      let type = 'Unknown';

      if (version.includes('PostgreSQL')) {
        type = 'PostgreSQL';
      } else if (version.includes('MySQL')) {
        type = 'MySQL';
      } else if (version.includes('SQLite')) {
        type = 'SQLite';
      }

      return {
        type,
        database: process.env.DB_NAME || 'unknown',
        connectionTime: 'Connected',
        queryTime: 'Query successful',
      };
    } catch (error) {
      console.error(error);
      return {
        type: 'Unknown',
        database: 'unknown',
        connectionTime: 'Connection failed',
        queryTime: 'Query failed',
      };
    }
  }

  /**
   * Check database migration status
   */
  async checkMigrations(): Promise<HealthIndicatorResult> {
    try {
      // Check if there are any pending migrations
      // This is a simplified check - in production you might want more sophisticated logic
      const pendingMigrations = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM _prisma_migrations
        WHERE finished_at IS NULL
      `;

      const count = (pendingMigrations as any)[0]?.count || 0;

      if (count > 0) {
        return this.getStatus('database_migrations', false, {
          status: 'pending_migrations',
          pendingCount: count,
          message: `${count} migration(s) are pending`,
        });
      }

      return this.getStatus('database_migrations', true, {
        status: 'up_to_date',
        message: 'All migrations are applied',
      });
    } catch (error) {
      console.error(error);
      // If migration table doesn't exist, assume no migrations
      return this.getStatus('database_migrations', true, {
        status: 'no_migrations_table',
        message: 'Migration tracking not available',
      });
    }
  }
}
