import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';

// config
import {
  apiConfig,
  appConfig,
  cookieConfig,
  databaseConfig,
  emailConfig,
  jobsConfig,
  jwtConfig,
  limitRequestConfig,
  limitRequestConfigFactory,
  oauthConfig,
  storageConfig,
  validateEnv,
} from './config';

// common
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpLogInterceptor } from './common/interceptors/http-logger.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerCoreModule, LoggerModule } from './common/logger';

// modules
import { DocsModule } from './docs/docs.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './module/auth/auth.module';
import { JwtAuthGuard } from './module/auth/guards/jwt-auth.guard';
import { RolesGuard } from './module/auth/guards/roles.guard';
import { TokenService } from './module/auth/token.service';
import { CategoryModule } from './module/category/category.module';
import { ProductModule } from './module/product/product.module';
import { StoreModule } from './module/store/store.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './module/users/users.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AssetsModule } from './module/assets/assets.module';
import { CommonModule } from './module/common/common.module';
import { CustomerModule } from './module/customer/customer.module';
import { OauthModule } from './module/oauth/oauth.module';
import { OrderReturnModule } from './module/order-return/order-return.module';
import { OrdersModule } from './module/orders/orders.module';
import { PurchaseOrderModule } from './module/purchase-order/purchase-order.module';
import { PurchaseReturnModule } from './module/purchase-return/purchase-return.module';
import { ReportModule } from './module/report/report.module';
import { StatisticsModule } from './module/statistics/statistics.module';
import { StockMovementModule } from './module/stock-movement/stock-movement.module';
import { StoreMemberModule } from './module/store-member/store-member.module';
import { StorePaymentModule } from './module/store-payment/store-payment.module';
import { StoreRewardPointModule } from './module/store-reward-point/store-reward-point.module';
import { SuppliersModule } from './module/suppliers/suppliers.module';
import { TagModule } from './module/tag/tag.module';
import { VariantModule } from './module/variant/variant.module';

import { BundleModule } from './module/bundle/bundle.module';
import { CatalogModule } from './module/catalog/catalog.module';
import { FinanceModule } from './module/finance/finance.module';
import { FeedbackModule } from './module/feedback/feedback.module';
import { AdminModule } from './module/admin/admin.module';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      // public uploads
      {
        rootPath: join(process.cwd(), 'uploads', 'public'),
        serveRoot: '/uploads/public',
        serveStaticOptions: {
          index: false,
        },
      },
      // legacy uploads (if any)
      {
        rootPath: join(process.cwd(), 'uploads'),
        serveRoot: '/uploads',
        serveStaticOptions: {
          index: false,
        },
      },
      // public assets
      {
        rootPath: join(process.cwd(), 'public'),
        serveRoot: '/assets',
      },
      // docs assets
      {
        rootPath: join(process.cwd(), 'public', 'docs'),
        serveRoot: '/docs/assets',
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
        jwtConfig,
        oauthConfig,
        emailConfig,
        cookieConfig,
        apiConfig,
        limitRequestConfig,
        storageConfig,
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
    OauthModule,
    ScheduleModule.forRoot(),
    JobsModule,
    ProductModule,
    StockMovementModule,
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
    TagModule,
    VariantModule,
    StoreMemberModule,
    ReportModule,
    AssetsModule,
    PurchaseReturnModule,
    OrderReturnModule,
    FinanceModule,

    CatalogModule,

    BundleModule,

    FeedbackModule,

    AdminModule,
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
