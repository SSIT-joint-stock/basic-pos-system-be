import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// modules
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { appConfig, databaseConfig, jobsConfig, validateEnv } from './config';
import { HttpLogInterceptor } from './common/interceptors/http-logger.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerCoreModule, LoggerModule } from './common/logger';
import { JobsModule } from './jobs/jobs.module';
import { ProductModule } from './module/product/product.module';
import { InventoryModule } from './module/inventory/inventory.module';
import { StockMovementModule } from './module/stock-movement/stock-movement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`],
      // validate with Zod
      validate: validateEnv, // use Zod to validate and type
      load: [appConfig, databaseConfig, jobsConfig],
    }),
    LoggerCoreModule,
    LoggerModule.forFeature(['HTTP', 'DATABASE', 'APP']),
    PrismaModule,
    UsersModule,
    ScheduleModule.forRoot(),
    JobsModule,
    ProductModule,
    InventoryModule,
    StockMovementModule,
  ],
  providers: [HttpLogInterceptor, ResponseInterceptor, AllExceptionsFilter],
})
export class AppModule {}
