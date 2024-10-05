import { registerAs } from '@nestjs/config';

export default registerAs('server', () => ({
  sessionSecret: process.env.SESSION_SECRET,
  host: process.env.HOST,
  port: parseInt(process.env.PORT) || 5000,
  serverUrl: process.env.SERVER_URL,
}));
