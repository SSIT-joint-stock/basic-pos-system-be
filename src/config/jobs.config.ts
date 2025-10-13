import { registerAs } from '@nestjs/config';

export default registerAs('jobs', () => ({
  timezone: process.env.TZ ?? 'Asia/Ho_Chi_Minh',
  exampleCron: process.env.EXAMPLE_CRON ?? '0 2 * * *',
  client_id: process.env.CLIENT_ID ?? 'phamminh',
  client_secret: process.env.CLIENT_SECRET ?? 'phaminh',
}));
