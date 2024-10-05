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

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let appConfigService: AppConfigService;
  let referralCodeRepository: ReferralCodeRepository;
  let referralCodeService: ReferralCodeService;

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
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        ReferralCodeService,
        AppConfigService,
        {
          provide: UserRepository,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: ReferralCodeService,
          useValue: createMock<ReferralCodeService>(),
        },
        {
          provide: ReferralCodeRepository,
          useValue: createMock<ReferralCodeRepository>(),
        },
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    appConfigService = module.get<AppConfigService>(AppConfigService);
    referralCodeRepository = module.get<ReferralCodeRepository>(
      ReferralCodeRepository,
    );
    referralCodeService = module.get<ReferralCodeService>(ReferralCodeService);
  });

  describe('create', () => {
    it('should successfully create a user without referral code', async () => {
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

    it('should successfully create a user with referral code', async () => {
      // first create referral code
      const referralCode = new ReferralCodeEntity();
      referralCode.code = 'LZGTSLJI';
      referralCode.timesUsed = 0;
      jest
        .spyOn(referralCodeRepository, 'create')
        .mockResolvedValue(referralCode);

      // create a referral code
      await referralCodeService.create(referralCode);

      const userSignUpDto: UserSignUpDto = {
        email: 'test@test.com',
        password: 'Password123',
        name: 'Test User',
        confirm: 'Password123',
        referral: 'LZGTSLJI',
      };
      const expectedUser = new UserEntity();
      jest.spyOn(userRepository, 'create').mockResolvedValue(expectedUser);
      appConfigService.otherConfig.requireSignupWithReferral = true;
      const result = await service.create(userSignUpDto);
      expect(result).toEqual(expectedUser);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: userSignUpDto.name,
        email: userSignUpDto.email,
        password: expect.any(String),
        confirm: userSignUpDto.confirm,
        status: UserStatus.PENDING,
        role: 'user',
        referralCode: null, // this is correct because only when the user is verified, the referral code is created
        referredBy: undefined,
      });
    });

    it('should throw BadRequestException when referral code is invalid', async () => {
      const userSignUpDto: UserSignUpDto = {
        email: 'test@test.com',
        password: 'Password123',
        name: 'Test User',
        confirm: 'Password123',
        referral: 'INVALID',
      };

      jest.spyOn(referralCodeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(userSignUpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when referral code is maxed out', async () => {
      const userSignUpDto: UserSignUpDto = {
        email: 'test@test.com',
        password: 'Password123',
        name: 'Test User',
        confirm: 'Password123',
        referral: 'MAXEDOUT',
      };

      const maxedOutReferralCode = new ReferralCodeEntity();
      maxedOutReferralCode.timesUsed =
        appConfigService.otherConfig.referralCodeMaximumUsage;

      jest
        .spyOn(referralCodeRepository, 'findOne')
        .mockResolvedValue(maxedOutReferralCode);

      await expect(service.create(userSignUpDto)).rejects.toThrow(
        BadRequestException,
      );
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
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
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
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
        },
      );
    });
  });

  describe('updateRole', () => {
    it('should successfully update user role', async () => {
      const callerUser = new UserEntity();
      callerUser.id = 1;
      callerUser.role = Role.ADMIN;

      const targetUser = new UserEntity();
      targetUser.id = 2;
      targetUser.role = Role.USER;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(targetUser);
      jest.spyOn(targetUser, 'save').mockResolvedValue(targetUser);

      await service.updateRole(callerUser, 2, Role.ADMIN, false);

      // find the updated user
      const updatedUser = await userRepository.findOne({ id: 2 });

      expect(updatedUser).toEqual(targetUser);
      expect(updatedUser.role).toBe(Role.ADMIN);
    });

    it('should throw exception if trying to change own role', async () => {
      const callerUser = new UserEntity();
      callerUser.id = 1;

      await expect(
        service.updateRole(callerUser, 1, Role.ADMIN, false),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      const callerUser = new UserEntity();
      callerUser.id = 1;
      callerUser.role = Role.ADMIN;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateRole(callerUser, 2, Role.ADMIN, false),
      ).rejects.toThrow(NotFoundException);
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
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
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
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
        },
      );
    });
  });

  describe('list', () => {
    it('should return a list of users', async () => {
      // Arrange
      const page = 0;
      const limit = 10;
      const idsStr = '1,2,3';
      const expectedUsers = [
        new UserEntity(),
        new UserEntity(),
        new UserEntity(),
      ];
      const expectedUsersWithoutSecret = expectedUsers.map(() => ({
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        email: undefined,
        name: undefined,
        role: undefined,
        status: undefined,
        isTwoFactorAuthEnabled: undefined,
        referralCode: undefined,
        referredBy: null,
      }));

      jest.spyOn(userRepository, 'find').mockResolvedValue(expectedUsers);

      // Act
      const result = await service.list(page, limit, true, idsStr);

      // Assert
      expect(userRepository.find).toHaveBeenCalledWith(
        { id: In([1, 2, 3]) },
        {
          skip: 0,
          take: 10,
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
        },
      );
      expect(result).toEqual(expectedUsersWithoutSecret);
    });

    it('should return a list of active users', async () => {
      const page = 1;
      const limit = 10;
      const onlyActiveUsers = true;
      const mockActiveUsers = [new UserEntity(), new UserEntity()];
      const mockActiveUsersWithoutSecret = mockActiveUsers.map(() => ({
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        email: undefined,
        name: undefined,
        role: undefined,
        status: undefined,
        isTwoFactorAuthEnabled: undefined,
        referralCode: undefined,
        referredBy: null,
      }));
      jest.spyOn(userRepository, 'find').mockResolvedValue(mockActiveUsers);

      const result = await service.list(
        page,
        limit,
        true,
        undefined,
        onlyActiveUsers,
      );
      expect(userRepository.find).toHaveBeenCalledWith(
        { status: 'ACTIVE' },
        {
          skip: 10,
          take: 10,
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
        },
      );
      expect(result).toEqual(mockActiveUsersWithoutSecret);
    });

    it('should handle errors when retrieving users', async () => {
      const page = 0;
      const limit = 10;
      const error = new Error('Error en la base de datos');
      jest.spyOn(userRepository, 'find').mockRejectedValue(error);

      await expect(service.list(page, limit)).rejects.toThrow(error);

      expect(userRepository.find).toHaveBeenCalledWith(
        {},
        {
          skip: 0,
          take: 10,
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
        },
      );
    });

    it('should return an empty array when no users are found', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValue([]);

      const result = await service.list(0, 10);

      expect(result).toEqual([]);
    });

    it('should handle pagination correctly', async () => {
      const mockUsers = Array(15)
        .fill(null)
        .map(() => new UserEntity());
      jest
        .spyOn(userRepository, 'find')
        .mockResolvedValue(mockUsers.slice(10, 15));

      const result = await service.list(1, 10);

      expect(result).toHaveLength(5);
      expect(userRepository.find).toHaveBeenCalledWith(
        {},
        {
          skip: 10,
          take: 10,
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
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
    it('should activate a user and create a referral code if allowed', async () => {
      const userEntity = new UserEntity();
      userEntity.referredBy = { id: 2 } as UserEntity;
      const referralCodeEntity = new ReferralCodeEntity();

      jest
        .spyOn(referralCodeRepository, 'create')
        .mockResolvedValue(referralCodeEntity);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new UserEntity());
      jest
        .spyOn(referralCodeService, 'useReferralCode')
        .mockResolvedValue(new ReferralCodeEntity());
      jest.spyOn(userEntity, 'save').mockResolvedValue(userEntity);

      appConfigService.otherConfig.requireSignupWithReferral = true;

      const result = await service.activate(userEntity);

      expect(result).toEqual(userEntity);
      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(result.referralCode).toEqual(referralCodeEntity);
      expect(referralCodeService.useReferralCode).toHaveBeenCalled();
    });

    it('should activate a user without creating a referral code if not allowed', async () => {
      const userEntity = new UserEntity();
      jest.spyOn(userEntity, 'save').mockResolvedValue(userEntity);

      appConfigService.otherConfig.requireSignupWithReferral = false;

      const result = await service.activate(userEntity);

      expect(result).toEqual(userEntity);
      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(result.referralCode).toBeUndefined();
      expect(referralCodeService.useReferralCode).not.toHaveBeenCalled();
    });
  });
});
