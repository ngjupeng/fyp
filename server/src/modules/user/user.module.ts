import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { ReferralModule } from '../referral/referral.module';
import { ReferralCodeService } from '../referral/referral.service';
import { AppConfigService } from '../../common/config/services/config.service';
import { ProviderEntity } from './provider.entity';
import { VerificationEntity } from './verification.entity';
import { ProviderRepository } from './provider.repository';
import { VerificationRepository } from './verification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ProviderEntity, VerificationEntity]),
    ConfigModule,
    ReferralModule,
  ],
  controllers: [UserController],
  providers: [
    Logger,
    UserService,
    UserRepository,
    ReferralCodeService,
    AppConfigService,
    ProviderRepository,
    VerificationRepository,
  ],
  exports: [UserService],
})
export class UserModule {}
