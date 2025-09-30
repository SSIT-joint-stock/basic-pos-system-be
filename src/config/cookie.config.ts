import { registerAs } from '@nestjs/config';

// Register the cookie config
export default registerAs('cookie', () => ({
  domain: process.env.COOKIE_DOMAIN || 'localhost',
  sameSite:
    (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
  secure: process.env.COOKIE_SECURE === 'true',
  httpOnly: process.env.COOKIE_HTTP_ONLY === 'true',
  maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000', 10), // 7 ngay`
}));
