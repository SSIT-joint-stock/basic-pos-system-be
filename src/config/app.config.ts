import { registerAs } from '@nestjs/config';

// register the app config
export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'nest-basic-prisma',
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  clientId: process.env.CLIENT_ID ?? 'phamminh',
  clientSecret: process.env.CLIENT_SECRET ?? 'phaminh',
  stateSecret: process.env.STATE_SECRET ?? 'this_is_secret',
  jwtSecret: process.env.JWT_SECRET ?? 'this_is_secret',
}));
