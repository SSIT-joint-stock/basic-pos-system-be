import { registerAs } from '@nestjs/config';

const isProd = process.env.NODE_ENV === 'production';

export default registerAs('cookie', () => ({
  domain: isProd ? process.env.COOKIE_DOMAIN : 'localhost',
  sameSite: (isProd ? 'none' : 'strict') as 'lax' | 'strict' | 'none',
  secure: process.env.COOKIE_SECURE === 'true',
  httpOnly: process.env.COOKIE_HTTP_ONLY === 'true',
  maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000', 10),
}));
