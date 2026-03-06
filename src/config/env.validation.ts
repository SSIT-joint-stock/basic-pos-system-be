import { z } from 'zod';

// define the environment variables schema
export const envSchema = z.object({
  // Environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Application
  APP_NAME: z.string().default('nest-basic-prisma'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('app'),
  DB_SCHEMA: z.string().default('public'),

  // Database URL (will be validated but can be constructed from above)
  DATABASE_URL: z.string().url(),

  // Docker Database Config (optional, used by docker-compose)
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),

  // Docker Ports (optional, used by docker-compose)
  DEV_DB_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  PROD_DB_PORT: z.coerce.number().int().min(1).max(65535).optional(),

  // Jobs
  TZ: z.string().default('Asia/Ho_Chi_Minh'),
  EXAMPLE_CRON: z.string().default('*/2 * * * *'), // every 2 minutes

  // Health Check Configuration
  HEALTH_ENDPOINTS_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default(false),

  // Security & Monitoring
  JWT_SECRET: z.string().default('your-super-secret-jwt-key-here'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // Email Configuration (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  // Redis Configuration (Optional - for caching)
  REDIS_URL: z.string().url().optional(),

  // File Upload Configuration
  UPLOAD_DEST: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().min(1).default(10485760), // 10MB
  MAX_UPLOAD_SIZE: z.coerce.number().int().min(1).optional(),
  ALLOWED_MIME_TYPES: z.string().optional(),

  // --- STORAGE CONFIGURATION ---
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_ROOT_DIR: z.string().default('/app/storage'),
  STORAGE_PUBLIC_DIR_NAME: z.string().default('public'),
  STORAGE_PRIVATE_DIR_NAME: z.string().default('private'),
  STORAGE_TEMP_DIR_NAME: z.string().default('temp'),

  // --- CDN / PUBLIC ACCESS ---
  ASSET_CDN_URL: z.string().url().default('https://cdn.example.com'),

  // Logging Configuration
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),
  LOG_FILE_MAX_SIZE: z.string().default('10m'),
  LOG_FILE_MAX_FILES: z.coerce.number().int().min(1).default(5),

  // Rate Limiting (Optional)
  RATE_LIMIT_TTL: z.coerce.number().int().min(1).optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).optional(),

  // CORS Configuration
  CORS_ORIGINS: z.string().optional(),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(20).default(12),

  // Monitoring (Optional)
  PROMETHEUS_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default(false),
  METRICS_PORT: z.coerce.number().int().min(1).max(65535).optional(),

  // OAuth2 Configuration (Optional)
  CLIENT_ID: z.string().optional(),
  CLIENT_SECRET: z.string().optional(),

  // Cookie Configuration
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('none'),
  COOKIE_SECURE: z
    .string()
    .transform((val) => val === 'true')
    .default(false)
    .pipe(z.boolean())
    .pipe(z.boolean()),
  COOKIE_HTTP_ONLY: z
    .string()
    .transform((val) => val === 'true')
    .default(true),
  COOKIE_MAX_AGE: z.coerce
    .number()
    .int()
    .min(1)
    .default(7 * 24 * 60 * 60 * 1000), // 7 days

  // Client
  FRONTEND_URL: z.string().default('http://localhost:3001'),
  APP_URL: z.string().default('http://localhost:3000'),
});

// define the environment variables type
export type Env = z.infer<typeof envSchema>;

// validate the environment variables
export function validateEnv(input: Record<string, unknown>): Env {
  // Construct DATABASE_URL if not provided but individual components are
  if (
    !input.DATABASE_URL &&
    input.DB_USER &&
    input.DB_PASSWORD &&
    input.DB_HOST &&
    input.DB_PORT &&
    input.DB_NAME &&
    input.DB_SCHEMA
  ) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    input.DATABASE_URL = `postgresql://${input.DB_USER}:${input.DB_PASSWORD}@${input.DB_HOST}:${input.DB_PORT}/${input.DB_NAME}?schema=${input.DB_SCHEMA}`;
  }

  // Parse CORS_ORIGINS into array if provided
  if (input.CORS_ORIGINS && typeof input.CORS_ORIGINS === 'string') {
    // Keep as string for now, can be split in the app configuration
    // input.CORS_ORIGINS = input.CORS_ORIGINS.split(',').map(origin => origin.trim());
  }

  // Parse and validate
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    // throw error to nestjs
    console.error('❌ Invalid environment variables:', issues);
    console.error('🔍 Failed validation details:', parsed.error.format());
    process.exit(1);
  }

  // Log successful validation in development
  if (parsed.data.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully');
  }

  return parsed.data;
}

// Helper function to get CORS origins as array
export function getCorsOrigins(env: Env): string[] {
  if (!env.CORS_ORIGINS) {
    return ['http://localhost:3000']; // default
  }
  return env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
}

// Helper function to check if email is configured
export function isEmailConfigured(env: Env): boolean {
  return !!(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);
}

// Helper function to check if Redis is configured
export function isRedisConfigured(env: Env): boolean {
  return !!env.REDIS_URL;
}

// Helper function to check if rate limiting is configured
export function isRateLimitingConfigured(env: Env): boolean {
  return !!(env.RATE_LIMIT_TTL && env.RATE_LIMIT_MAX);
}

// Helper function to check if OAuth2 is configured
export function isOAuth2Configured(env: Env): boolean {
  return !!(env.CLIENT_ID && env.CLIENT_SECRET);
}
