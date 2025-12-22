import { registerAs } from '@nestjs/config';

// register the app config
export default registerAs('oauth', () => ({
  clientId: process.env.CLIENT_ID ?? 'this_is_your_client_id',
  clientSecret: process.env.CLIENT_SECRET ?? 'this_is_your_client_secret',
  callbackURL: process.env.CALLBACK_URL ?? 'this_is_your_callback_url',
  scopes: process.env.SCOPES,
}));
