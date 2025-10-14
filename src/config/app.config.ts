import { registerAs } from '@nestjs/config';

// register the app config
export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'nest-basic-prisma',
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  origins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'],
  clientId: process.env.CLIENT_ID ?? 'phamminh',
  clientSecret: process.env.CLIENT_SECRET ?? 'phaminh',
  jwtSecret: process.env.JWT_SECRET ?? 'this_is_secret',
}));
