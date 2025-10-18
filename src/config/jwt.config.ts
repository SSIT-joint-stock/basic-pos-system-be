import { registerAs } from '@nestjs/config';

// register the app config
export default registerAs('jwt', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'this_is_secret',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
}));
