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
  pinataJwt: process.env.PINATA_JWT,
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataApiSecret: process.env.PINATA_API_SECRET,
  reclaim: {
    applicationId: process.env.RECLAIM_APPLICATION_ID,
    applicationSecret: process.env.RECLAIM_APPLICATION_SECRET,
    defaultSupportedProvidersId: process.env.DEFAULT_SUPPORTED_PROVIDERS_ID,
    defaultSupportedProvidersName: process.env.DEFAULT_SUPPORTED_PROVIDERS_NAME,
    defaultSupportedProvidersDescription:
      process.env.DEFAULT_SUPPORTED_PROVIDERS_DESCRIPTION,
    defaultSupportedProvidersCategory:
      process.env.DEFAULT_SUPPORTED_PROVIDERS_CATEGORY,
    callbackUrl: process.env.RECLAIM_CALLBACK_URL,
  },
}));
