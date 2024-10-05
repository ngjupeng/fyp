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

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
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
  ],
  exports: [UserService],
})
export class UserModule {}
