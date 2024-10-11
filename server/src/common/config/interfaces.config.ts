export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string; // this is the database name
  ssl: {
    rejectUnauthorized: boolean;
    require: boolean;
  };
}

export interface MailConfig {
  mailgun: {
    domain: string;
    apiKey: string;
    from: {
      email: string;
      name: string;
    };
  };
  resendInterval: number;
}

// @notice
// admin email and password is the default admin account that will be created when the server starts
export interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
  admin: {
    email: string;
    password: string;
  };
}

// @notice
// frontendUrl is for the verification email link, so the user will be redirected to the frontend when they click the link
// allowsSandbox is for the sandbox mode, extra functions are allowed in this mode such as signup_sandbox
export interface OthersConfig {
  frontendUrl: string;
  allowsSandbox: boolean;
  allowedDomains: string;
  requireSignupWithReferral: boolean;
  referralCodeMaximumUsage: number;
  defaultRole: string;
  require2FA: boolean;
  pinataJwt: string;
  pinataApiKey: string;
  pinataApiSecret: string;
}

// @notice
// host is the server host, for example, localhost
// port is the server port, for example, 3000
export interface ServerConfig {
  sessionSecret: string;
  host: string;
  port: number;
  serverUrl: string;
}
