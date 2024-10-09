export enum ErrorToken {
  NotFound = 'Token not found',
  InvalidFormat = 'Invalid token format',
  Expired = 'Token expired',
}
export enum ErrorMail {
  EmailNotSent = 'Email was not sent1',
}
export enum ErrorUser {
  NotFound = 'User not found',
  RoleSelfAssign = 'Cannot assign role to self',
  EmailExists = 'Email already in use',
  InvalidReferralCode = 'Invalid referral code',
  ReferralCodeMaxedOut = 'Referral code maxed out',
  UserAlreadyActive = 'User already active',
  UserNotActive = 'User is not active, verify your email',
  NoRole = 'User has no role',
  AdminRoleCannotBeChanged = 'Admin role cannot be changed',
  RoleCannotBeChanged = 'Role cannot be changed',
  AddressAlreadyBound = 'Address already bound to another user',
}

export enum ErrorAuth {
  UserNotActive = 'User is not active, verify your email',
  InvalidCredentials = 'Invalid credentials',
  InvalidTwoFactorCode = 'Invalid two-factor code',
  InvalidRefreshToken = 'Invalid refresh token',
  TwoFactorAuthAlreadyEnabled = 'Two factor auth already enabled',
  TwoFactorAuthDisabled = 'Two factor auth was not enabled',
  TwoFactorAuthRequired = 'Two factor auth required',
  Unauthorized = 'Unauthorized',
  SandboxDisabled = 'Sandbox is disabled',
  ResendInterval = 'Resend time too short',
}

export enum ErrorQuery {
  BadIdString = 'Bad id string',
}

export enum ErrorReferralCode {
  ReferralCodeNotFound = 'Referral code not found',
}
