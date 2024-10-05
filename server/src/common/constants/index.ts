export const APP = 'App_Name';
export const SERVICE_NAME = `${APP} Server`;
export const MAIL_TEMPLATES = {
  verification: (link: string) => {
    return {
      subject: `Email Verification - ${APP}`,
      text: `Click on the link to verify your email: ${link}`,
      html: `<a href="${link}">Click here to verify your email</a>`,
    };
  },
  resetPassword: (link: string) => {
    return {
      subject: `Reset Password - ${APP}`,
      text: `Click on the link to reset your password: ${link}`,
      html: `<a href="${link}">Click here to reset your password</a>`,
    };
  },
  enabled2fa: () => {
    return {
      subject: `2FA Enabled - ${APP}`,
      text: `Your 2FA is enabled`,
      html: `<p>Your 2FA is enabled</p>`,
    };
  },
};

export const ONE_HOUR_MS = 1000 * 60 * 60;

export const HALF_DAY_MS = ONE_HOUR_MS * 12;

export const ONE_DAY_MS = ONE_HOUR_MS * 24;

export const JWT_PREFIX = 'bearer ';
