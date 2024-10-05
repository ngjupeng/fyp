import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  mailgun: {
    domain: process.env.MAILGUN_DOMAIN,
    apiKey: process.env.MAILGUN_API_KEY,
    from: {
      email: process.env.MAILGUN_FROM_EMAIL,
      name: process.env.MAILGUN_FROM_NAME,
    },
  },
  resendInterval: process.env.EMAIL_VERIFICATION_RESEND_INTERVAL,
}));
