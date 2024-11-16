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
import { getAddress } from 'viem';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import {
  RequestProofResponseDto,
  VerificationCallbackDtoParsed,
} from './verification.dto';
import { VerificationRepository } from './verification.repository';
import { ProviderRepository } from './provider.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private HASH_ROUNDS = 12;
  constructor(
    private userRepository: UserRepository,
    private readonly referralCodeRepository: ReferralCodeRepository,
    private readonly referralCodeService: ReferralCodeService,
    private readonly appConfigService: AppConfigService,
    private verificationRepository: VerificationRepository,
    private providerRepository: ProviderRepository,
  ) {}

  public async requestProof(
    address: string,
    providerId: string,
  ): Promise<RequestProofResponseDto> {
    // search for wallet address
    const userWallet = await this.userRepository.findOne({ address });

    if (!userWallet) {
      throw new BadRequestException(ErrorUser.NotFound);
    }

    // search if providerId is supported
    const provider = await this.providerRepository.findOne({
      providerId,
    });

    if (!provider) {
      throw new BadRequestException('Not supported provider');
    }

    // if user wallet exist, put verification record in verifications table

    const reclaimProofRequest: ReclaimProofRequest =
      await ReclaimProofRequest.init(
        this.appConfigService.otherConfig.reclaim.applicationId,
        this.appConfigService.otherConfig.reclaim.applicationSecret,
        providerId,
      );

    const reclaimProofRequestConfig = JSON.parse(
      reclaimProofRequest.toJsonString(),
    );

    const sessionid = reclaimProofRequestConfig?.sessionId;

    const verification = await this.verificationRepository.findOne({
      user: {
        address,
      },
      provider: {
        id: provider.id,
      },
    });

    if (verification) {
      console.log('halo');
      // if verification record exist, update the sessionId
      await this.verificationRepository.updateOne(
        {
          user: {
            address,
          },
          provider: {
            id: provider.id,
          },
        },
        { sessionId: sessionid, verified: false },
      );
    } else {
      // if verification record not exist, create a new record
      await this.verificationRepository.create({
        sessionId: sessionid,
        user: userWallet,
        provider: provider,
        verified: false,
        count: 0,
      });
    }

    reclaimProofRequest.addContext(address, sessionid);

    // this will later call our server callback endpoint,
    // we will do the verification on our server rather than on verification server
    reclaimProofRequest.setAppCallbackUrl(
      this.appConfigService.otherConfig.reclaim.callbackUrl + '/user/callback',
    );

    const requestUrl = await reclaimProofRequest.getRequestUrl();
    const statusUrl = reclaimProofRequest.getStatusUrl();
    return { requestUrl, statusUrl, sessionId: sessionid };
  }

  public async verificationCallback(body: string) {
    try {
      const proof: VerificationCallbackDtoParsed = JSON.parse(
        decodeURIComponent(body),
      );

      // get context added from request proof
      const context = JSON.parse(proof.claimData.context);

      // this is the address that requested the proof, can be address of starknet or arbitrum
      const sessionId = context.contextMessage;

      // find the verification record via sessionId
      const verificationRecord = await this.verificationRepository.findOne(
        {
          sessionId,
        },
        {
          relations: ['user', 'user.referredBy', 'provider'],
        },
      );
      if (!verificationRecord) {
        throw new BadRequestException('Invalid callbackId');
      }

      console.log(context);
      const extractedParameters = context?.extractedParameters;

      switch (verificationRecord.provider.providerId) {
        case 'c94476a0-8a75-4563-b70a-bf6124d7c59b':
          // kaggle
          const username = extractedParameters?.username;

          // check if username is already taken
          const userWithUsername = await this.userRepository.findOne({
            kaggleUsername: username,
          });

          if (userWithUsername) {
            throw new BadRequestException('Username already taken');
          }

          // update user kaggle username
          await this.userRepository.updateOne(
            { address: verificationRecord?.user?.address },
            { kaggleUsername: username },
          );
          break;
        case 'f9f383fd-32d9-4c54-942f-5e9fda349762':
          // google

          const email = extractedParameters?.email;

          // check if email is already taken
          const userWithEmail = await this.userRepository.findOne({
            googleEmail: email,
          });

          if (userWithEmail) {
            throw new BadRequestException('Email already taken');
          }

          // update user email
          await this.userRepository.updateOne(
            { address: verificationRecord?.user?.address },
            { googleEmail: email },
          );

          break;
      }

      // update verification status in the database
      await this.verificationRepository.updateOne(
        { sessionId },
        { verified: true, count: verificationRecord.count + 1 },
      );
    } catch (error) {
      throw new BadRequestException(error);
      console.error('Parse error:', error);
    }
  }

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
