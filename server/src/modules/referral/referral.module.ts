import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralCodeEntity } from './referral.entity';
import { ConfigModule } from '@nestjs/config';
import { ReferralCodeRepository } from './referral.repository';
import { ReferralCodeService } from './referral.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReferralCodeEntity]), ConfigModule],
  providers: [ReferralCodeRepository, ReferralCodeService],
  exports: [ReferralCodeService, ReferralCodeRepository],
})
export class ReferralModule {}
