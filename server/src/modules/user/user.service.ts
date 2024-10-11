import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserEntity } from './user.entity';
import { UserStatus } from '../../common/enums/user';
import { UserSignUpDto } from './user.dto';
import { UserRepository } from './user.repository';
import { ErrorAuth, ErrorUser } from '../../common/constants/errors';
import { In } from 'typeorm';
import { Role } from '../../common/enums/role';
import { ReferralCodeRepository } from '../referral/referral.repository';
import { ReferralCodeEntity } from '../referral/referral.entity';
import { ReferralCodeService } from '../referral/referral.service';
import { AppConfigService } from '../../common/config/services/config.service';
import { UserWithoutSecretDto } from './user.response.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private HASH_ROUNDS = 12;
  constructor(
    private userRepository: UserRepository,
    private readonly referralCodeRepository: ReferralCodeRepository,
    private readonly referralCodeService: ReferralCodeService,
    private readonly appConfigService: AppConfigService,
  ) {}

  public async create(
    dto: UserSignUpDto,
    isSandbox: boolean = false,
  ): Promise<UserEntity> {
    let referralCodeEntity: ReferralCodeEntity | null = null;
    let referralCodeOwner: UserEntity | null = null;
    // first check if referral code is null
    const { email, password, referral: referralCode, ...rest } = dto;
    if (referralCode) {
      referralCodeEntity = await this.referralCodeRepository.findOne({
        code: referralCode,
      });
      if (!referralCodeEntity) {
        throw new BadRequestException(ErrorUser.InvalidReferralCode);
      }
      // check if the referral code is maxed out
      if (
        referralCodeEntity.timesUsed >=
        this.appConfigService.otherConfig.referralCodeMaximumUsage
      ) {
        throw new BadRequestException(ErrorUser.ReferralCodeMaxedOut);
      }
      // get the owner of the referral code
      referralCodeOwner = await this.userRepository.findOne(
        {
          referralCode: {
            id: referralCodeEntity.id,
          },
        },
        {
          relations: ['referralCode'],
        },
      );
    }
    const hashedPassword = bcrypt.hashSync(password, this.HASH_ROUNDS);
    const role =
      this.appConfigService.otherConfig.defaultRole == 'user'
        ? Role.USER
        : null;

    const userPayload = {
      ...rest,
      email,
      password: hashedPassword,
      role: role,
      status: isSandbox ? UserStatus.ACTIVE : UserStatus.PENDING,
      referralCode: null,
      referredBy: referralCodeOwner,
    };

    if (isSandbox && referralCode) {
      await this.referralCodeService.useReferralCode(referralCodeOwner);

      const referralCodeEntity = await this.referralCodeRepository.create({
        code: this.referralCodeService.generateCode(),
        timesUsed: 0,
      });
      userPayload.referralCode = referralCodeEntity;
    }
    return await this.userRepository.create(userPayload);
  }

  public async update(dto: UserSignUpDto): Promise<UserEntity> {
    // search for referral code
    const { email, password, referral: referralCode, ...rest } = dto;
    let referralCodeEntity: ReferralCodeEntity | null = null;
    let referralCodeOwner: UserEntity | null = null;
    // first check if referral code is null
    if (referralCode) {
      referralCodeEntity = await this.referralCodeRepository.findOne({
        code: referralCode,
      });
      if (!referralCodeEntity) {
        throw new BadRequestException(ErrorUser.InvalidReferralCode);
      }
      // check if the referral code is maxed out
      if (
        referralCodeEntity.timesUsed >=
        this.appConfigService.otherConfig.referralCodeMaximumUsage
      ) {
        throw new BadRequestException(ErrorUser.ReferralCodeMaxedOut);
      }
      // get the owner of the referral code
      referralCodeOwner = await this.userRepository.findOne(
        {
          referralCode: {
            id: referralCodeEntity.id,
          },
        },
        {
          relations: ['referralCode'],
        },
      );
    }
    return await this.userRepository.updateOne(
      {
        email: dto.email,
      },
      {
        ...rest,
        password: bcrypt.hashSync(password, this.HASH_ROUNDS),
        referredBy: referralCodeOwner,
      },
    );
  }

  public async activate(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.status = UserStatus.ACTIVE;
    if (this.appConfigService.otherConfig.requireSignupWithReferral) {
      // create new referral code for this user
      const referralCodeEntity = await this.referralCodeRepository.create({
        code: this.referralCodeService.generateCode(),
        timesUsed: 0,
      });
      userEntity.referralCode = referralCodeEntity;
      const referredBy = await this.userRepository.findOne(
        {
          id: userEntity.referredBy.id,
        },
        {
          relations: ['referredBy', 'referralCode'],
        },
      );

      await this.referralCodeService.useReferralCode(referredBy);
    }
    return userEntity.save();
  }

  public getByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOne(
      { email },
      {
        relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
      },
    );
  }

  public async getById(
    id: number,
    isExtend: boolean,
  ): Promise<UserWithoutSecretDto> {
    isExtend = String(isExtend) == 'true';
    const userEntity = await this.userRepository.findOne(
      { id },
      {
        relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
      },
    );
    if (!userEntity) {
      throw new NotFoundException(ErrorUser.NotFound);
    }
    return {
      id: userEntity.id,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
      email: userEntity.email,
      name: userEntity.name,
      role: userEntity.role,
      status: userEntity.status,
      isTwoFactorAuthEnabled: userEntity.isTwoFactorAuthEnabled,
      address: userEntity.address,
      referralCode: isExtend
        ? userEntity.referralCode
        : userEntity.referralCode
          ? userEntity.referralCode.id
          : null,
      referredBy: isExtend
        ? userEntity.referredBy
          ? {
              id: userEntity.referredBy.id,
              email: userEntity.referredBy.email,
              name: userEntity.referredBy.name,
              role: userEntity.referredBy.role,
              referralCode: userEntity.referredBy.referralCode,
            }
          : null
        : userEntity.referredBy
          ? userEntity.referredBy.id
          : null,
    };
  }

  public updatePassword(
    userEntity: UserEntity,
    password: string,
  ): Promise<UserEntity> {
    userEntity.password = bcrypt.hashSync(password, this.HASH_ROUNDS);
    return userEntity.save();
  }

  public async getByCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    const userEntity = await this.getByEmail(email);
    if (!userEntity) {
      throw new NotFoundException(ErrorUser.NotFound);
    }
    if (!bcrypt.compareSync(password, userEntity.password)) {
      throw new NotFoundException(ErrorAuth.InvalidCredentials);
    }
    return userEntity;
  }

  public async updateRole(
    callerUser: UserEntity,
    id: number,
    role: Role,
    isRemove: boolean,
  ): Promise<void> {
    if (callerUser.id === id) {
      throw new BadRequestException(ErrorUser.RoleSelfAssign);
    }

    const userEntity = await this.userRepository.findOne({ id });
    if (!userEntity) {
      throw new NotFoundException(ErrorUser.NotFound);
    }

    if (userEntity?.role === Role.ADMIN) {
      throw new BadRequestException(ErrorUser.AdminRoleCannotBeChanged);
    }

    if (
      userEntity?.role === Role.ADMINONLYVIEW &&
      callerUser.role !== Role.ADMIN
    ) {
      throw new BadRequestException(ErrorUser.RoleCannotBeChanged);
    }

    userEntity.role = isRemove ? null : role;
    await userEntity.save();
  }

  public async updateTwoFactorAuthSecret(
    userEntity: UserEntity,
    secret: string,
  ): Promise<UserEntity> {
    userEntity.twoFactorAuthSecret = secret;
    return userEntity.save();
  }

  public async changeTwoFactorAuth(
    userEntity: UserEntity,
    enable: boolean,
  ): Promise<UserEntity> {
    userEntity.isTwoFactorAuthEnabled = enable;
    return userEntity.save();
  }

  public async list(
    page: number,
    limit: number,
    isExtend?: boolean,
    idsStr?: string,
    onlyActiveUsers?: boolean,
  ): Promise<UserWithoutSecretDto[]> {
    isExtend = String(isExtend) == 'true';
    // map ids str to array of ids
    let userEntities: UserEntity[];
    const ids = idsStr
      ? idsStr.split(',').map((id) => parseInt(id))
      : undefined;
    if (ids) {
      userEntities = await this.userRepository.find(
        { id: In(ids) },
        {
          skip: page * limit,
          take: limit,
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
        },
      );
    }
    if (onlyActiveUsers) {
      userEntities = await this.userRepository.find(
        {
          status: UserStatus.ACTIVE,
        },
        {
          skip: page * limit,
          take: limit,
          relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
        },
      );
    }
    userEntities = await this.userRepository.find(
      {},
      {
        skip: page * limit,
        take: limit,
        relations: ['referralCode', 'referredBy', 'referredBy.referralCode'],
      },
    );
    // return with the same format as getById
    return userEntities.map((userEntity) => ({
      id: userEntity.id,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
      email: userEntity.email,
      name: userEntity.name,
      role: userEntity.role,
      status: userEntity.status,
      isTwoFactorAuthEnabled: userEntity.isTwoFactorAuthEnabled,
      referralCode: isExtend
        ? userEntity.referralCode
        : userEntity.referralCode
          ? userEntity.referralCode.id
          : null,
      referredBy: isExtend
        ? userEntity.referredBy
          ? {
              id: userEntity.referredBy.id,
              email: userEntity.referredBy.email,
              name: userEntity.referredBy.name,
              role: userEntity.referredBy.role,
              referralCode: userEntity.referredBy.referralCode,
            }
          : null
        : userEntity.referredBy
          ? userEntity.referredBy.id
          : null,
    }));
  }

  public async bindAddress(
    userEntity: UserEntity,
    address: string,
  ): Promise<void> {
    // first check if the address is already bound to another user
    const userWithAddress = await this.userRepository.findOne({ address });
    if (userWithAddress) {
      throw new BadRequestException(ErrorUser.AddressAlreadyBound);
    }
    userEntity.address = address;
    await userEntity.save();
  }
}
