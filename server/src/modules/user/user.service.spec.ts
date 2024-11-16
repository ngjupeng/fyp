import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserEntity } from './user.entity';
import { UserSignUpDto } from './user.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '../../common/enums/role';
import { In } from 'typeorm';
import { ReferralCodeService } from '../referral/referral.service';
import { AppConfigService } from '../../common/config/services/config.service';
import { createMock } from '@golevelup/ts-jest';
import { ReferralCodeRepository } from '../referral/referral.repository';
import { ReferralCodeEntity } from '../referral/referral.entity';
import { UserStatus } from '../../common/enums/user';
import { VerificationRepository } from './verification.repository';
import { ProviderRepository } from './provider.repository';
import { ErrorUser } from '../../common/constants/errors';

import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

// Mock ReclaimProofRequest
jest.mock('@reclaimprotocol/js-sdk', () => ({
  ReclaimProofRequest: {
    init: jest.fn().mockImplementation(() => ({
      toJsonString: () => JSON.stringify({ sessionId: 'mock-session-id' }),
      addContext: jest.fn(),
      setAppCallbackUrl: jest.fn(),
      getRequestUrl: jest.fn().mockResolvedValue('https://mock-request-url'),
      getStatusUrl: jest.fn().mockReturnValue('https://mock-status-url'),
    })),
  },
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let referralCodeRepository: jest.Mocked<ReferralCodeRepository>;
  let referralCodeService: jest.Mocked<ReferralCodeService>;
  let appConfigService: jest.Mocked<AppConfigService>;
  let verificationRepository: jest.Mocked<VerificationRepository>;
  let providerRepository: jest.Mocked<ProviderRepository>;

  const mockUserRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    save: jest.fn(),
  };

  const mockVerificationRepository = {
    findOne: jest.fn(),
    updateOne: jest.fn(() => Promise.resolve({})),
    create: jest.fn(),
  };

  const mockReferralCodeRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockReferralCodeService = {
    generateCode: jest.fn(),
    useReferralCode: jest.fn(),
  };

  const mockProviderRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const mockAppConfigService: Partial<AppConfigService> = {
      otherConfig: {
        requireSignupWithReferral: true,
        allowedDomains: 'http://localhost:3000',
        referralCodeMaximumUsage: 10,
        defaultRole: 'user',
        allowsSandbox: true,
        frontendUrl: 'http://localhost:3000',
        require2FA: true,
        pinataApiKey: 'pinataApiKey',
        pinataApiSecret: 'pinataApiSecret',
        pinataJwt: 'pinataJwt',
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
        {
          provide: ReferralCodeRepository,
          useValue: mockReferralCodeRepository,
        },
        { provide: ReferralCodeService, useValue: mockReferralCodeService },
        { provide: AppConfigService, useValue: mockAppConfigService },
        {
          provide: VerificationRepository,
          useValue: mockVerificationRepository,
        },
        { provide: ProviderRepository, useValue: mockProviderRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    referralCodeRepository = module.get(ReferralCodeRepository);
    referralCodeService = module.get(ReferralCodeService);
    appConfigService = module.get(AppConfigService);
    verificationRepository = module.get(VerificationRepository);
    providerRepository = module.get(ProviderRepository);
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      const userSignUpDto: UserSignUpDto = {
        email: 'test@test.com',
        password: 'Password123',
        name: 'Test User',
        confirm: 'Password123',
      };
      const expectedUser = new UserEntity();

      jest.spyOn(userRepository, 'create').mockResolvedValue(expectedUser);
      appConfigService.otherConfig.requireSignupWithReferral = false;

      const result = await service.create(userSignUpDto);

      expect(result).toEqual(expectedUser);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...userSignUpDto,
        password: expect.any(String),
        status: expect.any(String),
        role: 'user',
        referralCode: null,
        referredBy: null,
      });
    });

    describe('getByEmail', () => {
      it('should retrieve a user by email', async () => {
        const userEmail = 'test@test.com';
        const expectedUser = new UserEntity();
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(expectedUser);

        const result = await service.getByEmail(userEmail);

        expect(result).toEqual(expectedUser);
        expect(userRepository.findOne).toHaveBeenCalledWith(
          { email: userEmail },
          {
            relations: [
              'referralCode',
              'referredBy',
              'referredBy.referralCode',
            ],
          },
        );
      });

      it('should return null when user is not found', async () => {
        const email = 'nonexistent@example.com';
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

        const result = await service.getByEmail(email);

        expect(result).toBeNull();
        expect(userRepository.findOne).toHaveBeenCalledWith(
          { email },
          {
            relations: [
              'referralCode',
              'referredBy',
              'referredBy.referralCode',
            ],
          },
        );
      });
    });

    describe('updatePassword', () => {
      it('should update user password', async () => {
        // Arrange
        const userEntity = new UserEntity();
        const newPassword = 'newPassword';
        jest.spyOn(bcrypt, 'hashSync').mockReturnValue('hashedPassword');
        jest.spyOn(userEntity, 'save').mockResolvedValue(userEntity);

        // Act
        const result = await service.updatePassword(userEntity, newPassword);

        // Assert
        expect(bcrypt.hashSync).toHaveBeenCalledWith(
          newPassword,
          expect.any(Number),
        );
        expect(userEntity.save).toHaveBeenCalled();
        expect(userEntity.password).toBe('hashedPassword');
        expect(result).toBe(userEntity);
      });
    });

    describe('getById', () => {
      it('should return a user entity when found', async () => {
        // Arrange
        const userId = 1;
        const expectedUser = new UserEntity();
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(expectedUser);

        // Act
        const result = await service.getById(userId, true);

        // Assert
        expect(userRepository.findOne).toHaveBeenCalledWith(
          { id: userId },
          {
            relations: [
              'referralCode',
              'referredBy',
              'referredBy.referralCode',
            ],
          },
        );
        expect(result).toEqual({
          id: expectedUser.id,
          createdAt: expectedUser.createdAt,
          updatedAt: expectedUser.updatedAt,
          email: expectedUser.email,
          name: expectedUser.name,
          role: expectedUser.role,
          status: expectedUser.status,
          isTwoFactorAuthEnabled: expectedUser.isTwoFactorAuthEnabled,
          referralCode: expectedUser.referralCode,
          referredBy: null,
        });
      });

      it('should return null when user is not found', async () => {
        // Arrange
        const userId = 1;
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

        // Assert
        await expect(service.getById(userId, true)).rejects.toThrow(
          NotFoundException,
        );
        expect(userRepository.findOne).toHaveBeenCalledWith(
          { id: userId },
          {
            relations: [
              'referralCode',
              'referredBy',
              'referredBy.referralCode',
            ],
          },
        );
      });
    });

    describe('getbycredentials', () => {
      it('should return a user entity when found', async () => {
        // Arrange
        const mockUser = new UserEntity();
        mockUser.email = 'test@example.com';
        mockUser.password = bcrypt.hashSync('password', 10);
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

        // Act
        const result = await service.getByCredentials(
          'test@example.com',
          'password',
        );

        // Assert
        expect(result).toEqual(mockUser);
      });
      it('should throw NotFoundException if email is not found', async () => {
        // Arrange
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.getByCredentials('test@example.com', 'password'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if password does not match', async () => {
        // Arrange
        const mockUser = new UserEntity();
        mockUser.email = 'test@example.com';
        mockUser.password = bcrypt.hashSync('password', 10);
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

        // Act & Assert
        await expect(
          service.getByCredentials('test@example.com', 'wrongPassword'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('activate', () => {
      it('should activate a user', async () => {
        const userEntity = new UserEntity();
        jest.spyOn(userEntity, 'save').mockResolvedValue(userEntity);

        appConfigService.otherConfig.requireSignupWithReferral = false;

        const result = await service.activate(userEntity);

        expect(result).toEqual(userEntity);
        expect(result.status).toBe(UserStatus.ACTIVE);
      });
    });
  });

  describe('bindAddress', () => {
    const mockUser = {
      id: 1,
      save: jest.fn().mockImplementation(function (this: UserEntity) {
        return Promise.resolve(this);
      }),
    } as unknown as UserEntity;

    const mockAddress = '0x123...abc';

    it('should successfully bind address to user', async () => {
      userRepository.findOne.mockResolvedValue(null); // No existing user with this address
      userRepository.create.mockResolvedValue(mockUser);

      await service.bindAddress(mockUser, mockAddress);

      expect(mockUser.address).toBe(mockAddress);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if address already bound', async () => {
      userRepository.findOne.mockResolvedValue({} as UserEntity);

      await expect(service.bindAddress(mockUser, mockAddress)).rejects.toThrow(
        new BadRequestException(ErrorUser.AddressAlreadyBound),
      );
    });
  });

  describe('verificationCallback', () => {
    const mockSessionId = 'test-session-123';
    const mockVerificationRecord = {
      sessionId: mockSessionId,
      user: { address: '0x123' },
      provider: {
        providerId: 'f9f383fd-32d9-4c54-942f-5e9fda349762',
        id: 1,
      },
      count: 0,
    };

    it('should handle verification callback parse error', async () => {
      const invalidProofBody = 'invalid-json';

      await expect(
        service.verificationCallback(invalidProofBody),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle missing context in proof data', async () => {
      const proofBody = encodeURIComponent(
        JSON.stringify({
          claimData: {},
        }),
      );

      await expect(service.verificationCallback(proofBody)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle unsupported provider ID', async () => {
      const proofBody = encodeURIComponent(
        JSON.stringify({
          claimData: {
            context: JSON.stringify({
              contextMessage: mockSessionId,
              extractedParameters: { someData: 'test' },
            }),
          },
        }),
      );

      verificationRepository.findOne.mockResolvedValue({
        ...mockVerificationRecord,
        provider: {
          providerId: 'unsupported-provider',
          id: 999,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'Test Provider',
          description: 'Test Description',
        },
      } as any);

      await service.verificationCallback(proofBody);

      expect(verificationRepository.updateOne).toHaveBeenCalledWith(
        { sessionId: mockSessionId },
        { verified: true, count: 1 },
      );
    });
  });

  describe('requestProof', () => {
    const mockAddress = '0x123';
    const mockProviderId = 'test-provider-id';

    it('should throw BadRequestException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestProof(mockAddress, mockProviderId),
      ).rejects.toThrow();
    });

    it('should throw BadRequestException if provider not supported', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 } as UserEntity);
      providerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestProof(mockAddress, mockProviderId),
      ).rejects.toThrow();
    });
  });

  describe('verificationCallback for Google provider', () => {
    const mockSessionId = 'test-session-123';
    const mockVerificationRecord = {
      sessionId: mockSessionId,
      user: { address: '0x123' },
      provider: {
        providerId: 'f9f383fd-32d9-4c54-942f-5e9fda349762', // Google provider ID
        id: 1,
      },
      count: 0,
    };

    it('should handle Google email verification successfully', async () => {
      const proofBody = encodeURIComponent(
        JSON.stringify({
          claimData: {
            context: JSON.stringify({
              contextMessage: mockSessionId,
              extractedParameters: { email: 'test@gmail.com' },
            }),
          },
        }),
      );

      verificationRepository.findOne.mockResolvedValue(
        mockVerificationRecord as any,
      );
      userRepository.findOne.mockResolvedValue(null); // No existing user with email
      verificationRepository.updateOne.mockResolvedValue({} as any);
      userRepository.updateOne.mockResolvedValue({} as any);

      await service.verificationCallback(proofBody);

      expect(userRepository.updateOne).toHaveBeenCalledWith(
        { address: mockVerificationRecord.user.address },
        { googleEmail: 'test@gmail.com' },
      );
      expect(verificationRepository.updateOne).toHaveBeenCalledWith(
        { sessionId: mockSessionId },
        { verified: true, count: 1 },
      );
    });

    it('should throw BadRequestException for duplicate Google email', async () => {
      const proofBody = encodeURIComponent(
        JSON.stringify({
          claimData: {
            context: JSON.stringify({
              contextMessage: mockSessionId,
              extractedParameters: { email: 'existing@gmail.com' },
            }),
          },
        }),
      );

      verificationRepository.findOne.mockResolvedValue(
        mockVerificationRecord as any,
      );
      userRepository.findOne.mockResolvedValue({
        id: 1,
        googleEmail: 'existing@gmail.com',
      } as any); // Existing user with email

      await expect(service.verificationCallback(proofBody)).rejects.toThrow(
        new BadRequestException('Email already taken'),
      );
    });

    it('should handle invalid verification record', async () => {
      const proofBody = encodeURIComponent(
        JSON.stringify({
          claimData: {
            context: JSON.stringify({
              contextMessage: 'invalid-session',
            }),
          },
        }),
      );

      verificationRepository.findOne.mockResolvedValue(null);

      await expect(service.verificationCallback(proofBody)).rejects.toThrow(
        new BadRequestException('Invalid callbackId'),
      );
    });
  });

  describe('requestProof with existing verification', () => {
    const mockAddress = '0x123';
    const mockProviderId = 'f9f383fd-32d9-4c54-942f-5e9fda349762';
    const mockUser = { address: mockAddress } as UserEntity;
    const mockProvider = { id: 1, providerId: mockProviderId };
    const mockExistingVerification = {
      user: mockUser,
      provider: mockProvider,
      sessionId: 'old-session',
      verified: true,
      count: 1,
    };

    beforeEach(() => {
      userRepository.findOne.mockResolvedValue(mockUser as any);
      providerRepository.findOne.mockResolvedValue(mockProvider as any);
    });

    it('should update existing verification record', async () => {
      verificationRepository.findOne.mockResolvedValue(
        mockExistingVerification as any,
      );
      verificationRepository.updateOne.mockResolvedValue({} as any);
      providerRepository.findOne.mockResolvedValue(mockProvider as any);

      await service.requestProof(mockAddress, mockProviderId);

      expect(verificationRepository.updateOne).toHaveBeenCalledWith(
        {
          user: { address: mockAddress },
          provider: { id: mockProvider.id },
        },
        expect.objectContaining({
          verified: false,
          sessionId: expect.any(String),
        }),
      );
    });
  });
});
