import { ConfigService, registerAs } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
export const limitRequestConfig = (
  config: ConfigService,
): ThrottlerModuleOptions => {
  return {
    throttlers: [
      {
        ttl: config.get<number>('RATE_LIMIT_TTL', 60),
        limit: config.get<number>('RATE_LIMIT_MAX', 100),
      },
    ],
  };
};
export default registerAs('limit-request', () => ({
  ttl: process.env.RATE_LIMIT_TTL || 60,
  limit: process.env.RATE_LIMIT_MAX || 100,
}));
