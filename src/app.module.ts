import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';

// config
import {
  apiConfig,
  appConfig,
  cookieConfig,
  databaseConfig,
  emailConfig,
  jobsConfig,
  limitRequestConfig,
  limitRequestConfigFactory,
  validateEnv,
} from './config';

// common
import { LoggerCoreModule, LoggerModule } from './common/logger';
import { HttpLogInterceptor } from './common/interceptors/http-logger.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// modules
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './module/auth/auth.module';
import { DocsModule } from './docs/docs.module';
import { JwtAuthGuard } from './module/auth/guards/jwt-auth.guard';
import { RolesGuard } from './module/auth/guards/roles.guard';
import { TokenService } from './module/auth/token.service';
import { HealthModule } from './health/health.module';
import { ProductModule } from './module/product/product.module';
import { OAuthModule } from './module/oauth/oauth.module';
import { StoreModule } from './module/store/store.module';
import { CategoryModule } from './module/category/category.module';

import { InventoryModule } from './module/inventory/inventory.module';
import { StockMovementModule } from './module/stock-movement/stock-movement.module';
import { OrdersModule } from './module/orders/orders.module';
import { StatisticsModule } from './module/statistics/statistics.module';
import { CustomerModule } from './module/customer/customer.module';
import { CommonModule } from './module/common/common.module';
import { StorePaymentModule } from './module/store-payment/store-payment.module';
import { StoreRewardPointModule } from './module/store-reward-point/store-reward-point.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SuppliersModule } from './module/suppliers/suppliers.module';
import { PurchaseOrderModule } from './module/purchase-order/purchase-order.module';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      // uploads assets
      {
        rootPath: join(process.cwd(), 'uploads'),
        serveRoot: '/uploads', // http://host/uploads/...
        serveStaticOptions: {
          index: false,
          setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
          },
        },
      },
      // public assets
      {
        rootPath: join(process.cwd(), 'public'),
        serveRoot: '/assets', // http://host/public/...
      },
      // docs assets
      {
        rootPath: join(process.cwd(), 'public', 'docs'),
        serveRoot: '/docs/assets', // http://host/docs/assets/...
      },
    ),
    // config
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`],
      // validate with Zod
      validate: validateEnv, // use Zod to validate and type
      load: [
        appConfig,
        databaseConfig,
        jobsConfig,
        emailConfig,
        cookieConfig,
        apiConfig,
        limitRequestConfig,
      ],
    }),
    // limit request
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: limitRequestConfigFactory,
    }),
    LoggerCoreModule,
    LoggerModule.forFeature(['HTTP', 'DATABASE', 'APP', 'EMAIL']),
    PrismaModule,
    UsersModule,
    AuthModule,
    StoreModule,
    ProductModule,
    OAuthModule,
    ScheduleModule.forRoot(),
    JobsModule,
    ProductModule,
    StockMovementModule,
    InventoryModule,
    HealthModule,
    CategoryModule,
    DocsModule,
    OrdersModule,
    StatisticsModule,
    CustomerModule,
    CommonModule,
    StorePaymentModule,
    StoreRewardPointModule,
    SuppliersModule,
    PurchaseOrderModule,
  ],
  providers: [
    TokenService,
    HttpLogInterceptor,
    ResponseInterceptor,
    AllExceptionsFilter,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
