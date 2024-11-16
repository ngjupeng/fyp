import { ConfigService } from '@nestjs/config';
import {
  MOCK_ACCESS_TOKEN,
  MOCK_ADMIN_EMAIL,
  MOCK_USER_EMAIL,
  MOCK_FRONTEND_URL,
  MOCK_JWT_ACCESS_TOKEN_EXPIRES_IN,
  MOCK_NAME,
  MOCK_REFRESH_TOKEN,
  MOCK_STRONG_PASSWORD,
} from '../../../test/constants';
import { AuthService } from './auth.service';
import { authenticator } from 'otplib';
import { TokenRepository } from './token.repository';
import { UserService } from '../user/user.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { UserRepository } from '../user/user.repository';
import { UserStatus } from '../../common/enums/user';
import { Role } from '../../common/enums/role';
import { UserEntity } from '../user/user.entity';
import { ErrorAuth } from '../../common/constants/errors';
import { v4 } from 'uuid';
import { TokenType } from '../../common/enums/token';
import { TokenEntity } from './token.entity';
import { MAIL_TEMPLATES } from '../../common/constants';
import { AppConfigService } from '../../common/config/services/config.service';
import { ReferralCodeService } from '../referral/referral.service';
import { ReferralCodeRepository } from '../referral/referral.repository';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MailType } from '../../common/enums/mail';
import { VerificationRepository } from '../user/verification.repository';
import { ProviderRepository } from '../user/provider.repository';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('Auth Service', () => {
  let authService: AuthService;
  let userService: UserService;
  let mailService: MailService;
  let jwtService: JwtService;
  let appConfigService: AppConfigService;
  let tokenRepository: TokenRepository;
  let authRepository: AuthRepository;

  const userEntity = {
    id: 1,
    email: MOCK_ADMIN_EMAIL,
    password: MOCK_STRONG_PASSWORD,
    status: UserStatus.ACTIVE,
    role: Role.ADMIN,
    isTwoFactorAuthEnabled: false,
  };

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_TOKEN_EXPIRES_IN':
            return MOCK_JWT_ACCESS_TOKEN_EXPIRES_IN;
          case 'FRONTEND_URL':
            return MOCK_FRONTEND_URL;
        }
      }),
    };
    const mockAppConfigService: Partial<AppConfigService> = {
      authConfig: {
        jwt: {
          secret: 'jwt_secret',
          accessTokenExpiresIn: MOCK_JWT_ACCESS_TOKEN_EXPIRES_IN.toString(),
          refreshTokenExpiresIn: MOCK_JWT_ACCESS_TOKEN_EXPIRES_IN.toString(),
        },
        admin: {
          email: MOCK_ADMIN_EMAIL,
          password: MOCK_STRONG_PASSWORD,
        },
      },
      serverConfig: {
        host: '0.0.0.0',
        port: 3000,
        sessionSecret: 'session_secret',
        serverUrl: 'http://localhost:3001',
      },
      otherConfig: {
        frontendUrl: MOCK_FRONTEND_URL,
        allowsSandbox: true,
        allowedDomains: 'http://localhost:3000',
        requireSignupWithReferral: true,
        referralCodeMaximumUsage: 10,
        defaultRole: 'user',
        require2FA: false,
        pinataJwt: 'pinata_jwt',
        pinataApiKey: 'pinata_api_key',
        pinataApiSecret: 'pinata_api_secret',
        reclaim: {
          applicationId: 'reclaim_application_id',
          applicationSecret: 'reclaim_application_secret',
          defaultSupportedProvidersId: 'reclaim_default_supported_providers_id',
          defaultSupportedProvidersName:
            'reclaim_default_supported_providers_name',
          defaultSupportedProvidersDescription:
            'reclaim_default_supported_providers_description',
          defaultSupportedProvidersCategory:
            'reclaim_default_supported_providers_category',
          callbackUrl: 'reclaim_callback_url',
        },
      },
      mailConfig: {
        mailgun: {
          domain: 'mock-domain',
          apiKey: 'mock-api-key',
          from: {
            email: 'mock-from-email',
            name: 'mock-from-name',
          },
        },
        resendInterval: 30000,
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        ReferralCodeService,
        AppConfigService,
        JwtService,
        {
          provide: getRepositoryToken(AuthRepository),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        { provide: AuthRepository, useValue: createMock<AuthRepository>() },
        { provide: TokenRepository, useValue: createMock<TokenRepository>() },
        {
          provide: ReferralCodeRepository,
          useValue: createMock<ReferralCodeRepository>(),
        },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        {
          provide: ReferralCodeService,
          useValue: createMock<ReferralCodeService>(),
        },
        // Add this line:
        {
          provide: VerificationRepository,
          useValue: createMock<VerificationRepository>(),
        },
        {
          provide: ProviderRepository,
          useValue: createMock<ProviderRepository>(),
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
        { provide: MailService, useValue: createMock<MailService>() },
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    authRepository = moduleRef.get<AuthRepository>(AuthRepository);
    tokenRepository = moduleRef.get<TokenRepository>(TokenRepository);
    userService = moduleRef.get<UserService>(UserService);
    mailService = moduleRef.get<MailService>(MailService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    appConfigService = moduleRef.get<AppConfigService>(AppConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('signin', () => {
    const SignInDto = {
      email: MOCK_ADMIN_EMAIL,
      password: MOCK_STRONG_PASSWORD,
    };
    let getByCredentialsMock: any;

    beforeEach(() => {
      getByCredentialsMock = jest.spyOn(userService, 'getByCredentials');
      jest.spyOn(authService, 'auth').mockResolvedValue({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
        role: null,
        isTwoFactorAuthEnabled: false,
      });
    });

    it('should sign in user and get JWT', async () => {
      getByCredentialsMock.mockResolvedValue(userEntity as UserEntity);

      const result = await authService.signin(SignInDto);
      expect(userService.getByCredentials).toHaveBeenCalledWith(
        SignInDto.email,
        SignInDto.password,
      );
      expect(authService.auth).toHaveBeenCalledWith(userEntity, false);
      expect(result).toEqual({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
        role: null,
        isTwoFactorAuthEnabled: false,
      });
    });

    it('should throw UnauthorizedException is user credentials are invalid', async () => {
      getByCredentialsMock.mockResolvedValue(undefined);
      await expect(authService.signin(SignInDto)).rejects.toThrow(
        ErrorAuth.InvalidCredentials,
      );
      expect(userService.getByCredentials).toHaveBeenCalledWith(
        SignInDto.email,
        SignInDto.password,
      );
    });
  });

  describe('auth', () => {
    it('should create new auth entity if none exists', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(authRepository, 'create').mockResolvedValue({} as any);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');

      const result = await authService.auth(userEntity as UserEntity, false);

      expect(authRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should logout user if auth entity already exists', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue({} as any);
      jest.spyOn(authService, 'logout').mockResolvedValue();
      jest.spyOn(authRepository, 'create').mockResolvedValue({} as any);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');

      await authService.auth(userEntity as UserEntity, false);

      expect(authService.logout).toHaveBeenCalledWith(userEntity);
    });
  });

  describe('signup', () => {
    const userSignUpDto = {
      email: MOCK_USER_EMAIL,
      password: MOCK_STRONG_PASSWORD,
      confirm: MOCK_STRONG_PASSWORD,
      name: MOCK_NAME,
    };
    const tokenEntity = {
      uuid: v4(),
      tokenType: TokenType.EMAIL,
      user: userEntity,
    };

    // const emailVerifationTemplate =

    let createUserMock: any, createTokenMock: any;

    beforeEach(() => {
      createUserMock = jest.spyOn(userService, 'create');
      createTokenMock = jest.spyOn(tokenRepository, 'create');

      createUserMock.mockResolvedValue(userEntity as UserEntity);
      createTokenMock.mockResolvedValue(tokenEntity as TokenEntity);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('Should create a new user and return the new user entity', async () => {
      const user = { ...userEntity, status: UserStatus.PENDING };
      jest.spyOn(userService, 'getByEmail').mockResolvedValueOnce(null);
      jest.spyOn(userService, 'create').mockResolvedValue(user as UserEntity);
      jest.spyOn(tokenRepository, 'findOne').mockResolvedValue(null);

      const result = await authService.signup(userSignUpDto);
      expect(userService.create).toHaveBeenCalledWith(userSignUpDto);
      expect(tokenRepository.create).toHaveBeenCalledWith({
        tokenType: TokenType.EMAIL,
        user: user,
      });
      expect(result).toEqual(user);
    });

    it('should call email service to send email', async () => {
      const getByEmailMock = jest.spyOn(userService, 'getByEmail');
      getByEmailMock.mockResolvedValueOnce(null);

      const tokenFindOne = jest.spyOn(tokenRepository, 'findOne');
      tokenFindOne.mockResolvedValueOnce(null);

      mailService.sendEmail = jest.fn();
      await authService.signup(userSignUpDto);

      expect(mailService.sendEmail).toHaveBeenCalledWith({
        to: userEntity.email,
        ...MAIL_TEMPLATES.verification(
          `${MOCK_FRONTEND_URL}/verify-email?token=${tokenEntity.uuid}`,
        ),
      });
    });

    it('should update existing pending user and resend verification email', async () => {
      const existingUser = {
        ...userEntity,
        status: UserStatus.PENDING,
      };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(existingUser as UserEntity);
      jest
        .spyOn(userService, 'update')
        .mockResolvedValue(existingUser as UserEntity);
      jest.spyOn(authService, 'sendEmailWithMailType').mockResolvedValue();

      const result = await authService.signup(userSignUpDto);

      expect(userService.update).toHaveBeenCalledWith(userSignUpDto);
      expect(authService.sendEmailWithMailType).toHaveBeenCalledWith(
        existingUser,
        TokenType.EMAIL,
        MailType.VERIFICATION,
      );
      expect(result).toEqual(existingUser);
    });

    it('should throw BadRequestException if user already exists and is active', async () => {
      const activeUser = {
        ...userEntity,
        status: UserStatus.ACTIVE,
      };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(activeUser as UserEntity);

      await expect(authService.signup(userSignUpDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('signupSandbox', () => {
    const userSignUpSandboxDto = {
      email: MOCK_USER_EMAIL,
      password: MOCK_STRONG_PASSWORD,
      confirm: MOCK_STRONG_PASSWORD,
      name: MOCK_NAME,
    };

    it('should throw BadRequestException if sandbox is disabled', async () => {
      appConfigService.otherConfig.allowsSandbox = false;
      await expect(
        authService.signupSandbox(userSignUpSandboxDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should activate pending user in sandbox mode', async () => {
      const pendingUser = {
        ...userEntity,
        status: UserStatus.PENDING,
      };
      appConfigService.otherConfig.allowsSandbox = true;
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(pendingUser as UserEntity);
      jest
        .spyOn(userService, 'activate')
        .mockResolvedValue(userEntity as UserEntity);
      jest.spyOn(tokenRepository, 'findOne').mockResolvedValue(null);

      const result = await authService.signupSandbox(userSignUpSandboxDto);

      expect(userService.activate).toHaveBeenCalledWith(pendingUser);
      expect(result).toEqual(userEntity);
    });

    it('should remove existing email verification token for pending user', async () => {
      const userSignUpDto = {
        email: MOCK_USER_EMAIL,
        password: MOCK_STRONG_PASSWORD,
        confirm: MOCK_STRONG_PASSWORD,
        name: MOCK_NAME,
      };
      const pendingUser = { ...userEntity, status: UserStatus.PENDING };
      const mockToken = { remove: jest.fn() };
      appConfigService.otherConfig.allowsSandbox = true;
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(pendingUser as UserEntity);
      jest
        .spyOn(userService, 'activate')
        .mockResolvedValue(userEntity as UserEntity);
      jest
        .spyOn(tokenRepository, 'findOne')
        .mockResolvedValue(mockToken as any);

      await authService.signupSandbox(userSignUpDto);

      expect(mockToken.remove).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    const userEntity: Partial<UserEntity> = {
      id: 1,
    };

    it('should delete authentication entities based on email', async () => {
      const result = await authService.logout(userEntity as UserEntity);

      const deleteQuery = {
        userId: userEntity.id,
      };
      expect(authRepository.delete).toHaveBeenCalledWith(deleteQuery);
      expect(result).toEqual(undefined);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockRefreshToken = 'mockRefreshToken';
      const mockAuthEntity = {
        user: { id: 1, email: 'test@example.com', role: Role.USER },
        refreshToken: 'hashedRefreshToken',
        save: jest.fn(),
      };
      const mockNewTokens = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      };

      jest
        .spyOn(authService, 'hashToken')
        .mockReturnValue('hashedRefreshToken');
      jest
        .spyOn(authRepository, 'findOne')
        .mockResolvedValue(mockAuthEntity as any);
      jest.spyOn(authService['jwtService'], 'verifyAsync').mockResolvedValue({
        userId: 1,
        email: 'test@example.com',
        isTwoFaAuthenticated: false,
      });
      jest
        .spyOn(authService['jwtService'], 'signAsync')
        .mockResolvedValueOnce(mockNewTokens.accessToken)
        .mockResolvedValueOnce(mockNewTokens.refreshToken);

      const result = await authService.refreshToken(mockRefreshToken);

      expect(result).toEqual({
        accessToken: mockNewTokens.accessToken,
        refreshToken: mockNewTokens.refreshToken,
        role: Role.USER,
        isTwoFactorAuthEnabled: undefined,
      });
      expect(mockAuthEntity.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jest
        .spyOn(authService, 'hashToken')
        .mockReturnValue('hashedRefreshToken');
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(authService.refreshToken('invalidToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('generateTwoFactorAuthSecret', () => {
    it('should throw BadRequestException if 2FA is already enabled', async () => {
      const userWith2FA = { ...userEntity, isTwoFactorAuthEnabled: true };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(userWith2FA as UserEntity);

      await expect(
        authService.generateTwoFactorAuthSecret(userWith2FA as UserEntity),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyTwoFaCode', () => {
    it('should return true for valid 2FA code', async () => {
      const userWith2FASecret = {
        ...userEntity,
        twoFactorAuthSecret: 'secret',
      };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(userWith2FASecret as UserEntity);
      jest.spyOn(authenticator, 'verify').mockReturnValue(true);

      const result = await authService.verifyTwoFaCode(
        '123456',
        userWith2FASecret as UserEntity,
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid 2FA code', async () => {
      const userWith2FASecret = {
        ...userEntity,
        twoFactorAuthSecret: 'secret',
      };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(userWith2FASecret as UserEntity);
      jest.spyOn(authenticator, 'verify').mockReturnValue(false);

      const result = await authService.verifyTwoFaCode(
        'invalid',
        userWith2FASecret as UserEntity,
      );

      expect(result).toBe(false);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should throw BadRequestException for non-existent user', async () => {
      jest.spyOn(userService, 'getByEmail').mockResolvedValue(null);

      await expect(
        authService.resendVerificationEmail({
          email: 'nonexistent@example.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already active user', async () => {
      const activeUser = { ...userEntity, status: UserStatus.ACTIVE };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(activeUser as UserEntity);

      await expect(
        authService.resendVerificationEmail({ email: activeUser.email }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send verification email for pending user', async () => {
      const pendingUser = { ...userEntity, status: UserStatus.PENDING };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(pendingUser as UserEntity);
      jest.spyOn(authService, 'sendEmailWithMailType').mockResolvedValue();

      await authService.resendVerificationEmail({ email: pendingUser.email });

      expect(authService.sendEmailWithMailType).toHaveBeenCalledWith(
        pendingUser,
        TokenType.EMAIL,
        MailType.VERIFICATION,
      );
    });

    it('should throw BadRequestException if resend interval has not passed', async () => {
      const pendingUser = { ...userEntity, status: UserStatus.PENDING };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(pendingUser as any);

      const existingToken = {
        createdAt: new Date(Date.now() - 10000), // 10 seconds
        remove: jest.fn(),
      };
      jest
        .spyOn(tokenRepository, 'findOne')
        .mockResolvedValue(existingToken as any);

      await expect(
        authService.resendVerificationEmail({ email: pendingUser.email }),
      ).rejects.toThrow(new BadRequestException(ErrorAuth.ResendInterval));
      expect(existingToken.remove).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password email for active user', async () => {
      const activeUser = { ...userEntity, status: UserStatus.ACTIVE };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(activeUser as UserEntity);
      jest.spyOn(authService, 'sendEmailWithMailType').mockResolvedValue();

      await authService.forgotPassword({ email: activeUser.email });

      expect(authService.sendEmailWithMailType).toHaveBeenCalledWith(
        activeUser,
        TokenType.PASSWORD,
        MailType.RESET_PASSWORD,
      );
    });

    it('should throw UnauthorizedException for user with pending status', async () => {
      const pendingUser = {
        ...userEntity,
        status: UserStatus.PENDING,
      };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(pendingUser as UserEntity);
      const sendEmailWithMailTypeMock = jest
        .spyOn(authService, 'sendEmailWithMailType')
        .mockImplementation(() => Promise.resolve());
      await expect(
        authService.forgotPassword({ email: pendingUser.email }),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.getByEmail).toHaveBeenCalledWith(pendingUser.email);
      expect(sendEmailWithMailTypeMock).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      jest.spyOn(userService, 'getByEmail').mockResolvedValue(null);

      await expect(
        authService.forgotPassword({ email: 'nonexistent@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...userEntity, status: UserStatus.PENDING };
      jest
        .spyOn(userService, 'getByEmail')
        .mockResolvedValue(inactiveUser as UserEntity);

      await expect(
        authService.forgotPassword({ email: inactiveUser.email }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('restorePassword', () => {
    it('should restore password for valid token', async () => {
      const tokenEntity = { user: userEntity, remove: jest.fn() };
      jest.spyOn(authService, 'verifyUUIDToken').mockImplementation();
      jest
        .spyOn(tokenRepository, 'findOne')
        .mockResolvedValue(tokenEntity as any);
      jest
        .spyOn(userService, 'updatePassword')
        .mockResolvedValue(userEntity as UserEntity);

      const result = await authService.restorePassword({
        token: 'valid-uuid',
        password: 'newPassword',
        confirm: 'newPassword',
      });

      expect(result).toBe(true);
      expect(userService.updatePassword).toHaveBeenCalledWith(
        userEntity,
        'newPassword',
      );
      expect(tokenEntity.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid token', async () => {
      jest.spyOn(authService, 'verifyUUIDToken').mockImplementation();
      jest.spyOn(tokenRepository, 'findOne').mockResolvedValue(null);

      await expect(
        authService.restorePassword({
          token: 'invalid-uuid',
          password: 'newPassword',
          confirm: 'newPassword',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid UUID format', async () => {
      jest.spyOn(authService, 'verifyUUIDToken').mockImplementation(() => {
        throw new BadRequestException();
      });

      await expect(
        authService.restorePassword({
          token: 'invalid-format',
          password: 'newPassword',
          confirm: 'newPassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('emailVerification', () => {
    it('should activate user for valid token', async () => {
      const pendingUser = { ...userEntity, status: UserStatus.PENDING };
      const tokenEntity = { user: pendingUser, remove: jest.fn() };
      jest.spyOn(authService, 'verifyUUIDToken').mockImplementation();
      jest
        .spyOn(tokenRepository, 'findOne')
        .mockResolvedValue(tokenEntity as any);
      jest
        .spyOn(userService, 'activate')
        .mockResolvedValue(pendingUser as UserEntity);

      await authService.emailVerification({ token: 'valid-uuid' });

      expect(userService.activate).toHaveBeenCalledWith(pendingUser);
      expect(tokenEntity.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid token', async () => {
      jest.spyOn(authService, 'verifyUUIDToken').mockImplementation();
      jest.spyOn(tokenRepository, 'findOne').mockResolvedValue(null);

      await expect(
        authService.emailVerification({ token: 'invalid-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already active user', async () => {
      const tokenEntity = { user: userEntity, remove: jest.fn() };
      jest.spyOn(authService, 'verifyUUIDToken').mockImplementation();
      jest
        .spyOn(tokenRepository, 'findOne')
        .mockResolvedValue(tokenEntity as any);
      jest
        .spyOn(userService, 'activate')
        .mockResolvedValue(userEntity as UserEntity);

      await expect(
        authService.emailVerification({ token: 'valid-uuid' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyUUIDToken', () => {
    it('should not throw for valid UUID', () => {
      const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      expect(() => authService.verifyUUIDToken(validUUID)).not.toThrow();
    });

    it('should throw BadRequestException for invalid UUID', () => {
      const invalidUUID = 'not-a-uuid';
      expect(() => authService.verifyUUIDToken(invalidUUID)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('compareToken', () => {
    it('should return true for matching tokens', () => {
      const token = 'someToken';
      const hashedToken = authService.hashToken(token);
      expect(authService.compareToken(token, hashedToken)).toBe(true);
    });

    it('should return false for non-matching tokens', () => {
      const token1 = 'someToken';
      const token2 = 'anotherToken';
      const hashedToken1 = authService.hashToken(token1);
      expect(authService.compareToken(token2, hashedToken1)).toBe(false);
    });
  });
});
