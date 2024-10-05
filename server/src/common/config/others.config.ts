import { registerAs } from '@nestjs/config';

export default registerAs('others', () => ({
  frontendUrl: process.env.FRONTEND_URL,
  allowsSandbox: process.env.ALLOWS_SANDBOX,
  allowedDomains: process.env.ALLOWED_DOMAINS,
  requireSignupWithReferral:
    process.env.REQUIRE_SIGNUP_WITH_REFERRAL === 'true' ? true : false,
  referralCodeMaximumUsage: process.env.REFERRAL_CODE_MAXIMUM_USAGE,
  defaultRole: process.env.DEFAULT_ROLE,
  require2FA: process.env.REQUIRE_2FA === 'true' ? true : false,
}));
