import { registerAs } from '@nestjs/config';

// register the app config
export default registerAs('oauth', () => ({
  clientId: process.env.CLIENT_ID ?? 'phamminh',
  clientSecret: process.env.CLIENT_SECRET ?? 'phaminh',
  stateSecret: process.env.STATE_SECRET ?? 'this_is_secret',
  jwtSecret: process.env.JWT_SECRET ?? 'this_is_secret',
}));
