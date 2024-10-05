import { Injectable, Logger } from '@nestjs/common';
import { ReferralCodeRepository } from './referral.repository';
import { ReferralCodeDto } from './referral.dto';
import { ReferralCodeEntity } from './referral.entity';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class ReferralCodeService {
  private readonly logger = new Logger(ReferralCodeService.name);

  constructor(
    private readonly referralCodeRepository: ReferralCodeRepository,
  ) {}

  // create referral code for user who verified successfully
  public async create(dto: ReferralCodeDto): Promise<ReferralCodeEntity> {
    return await this.referralCodeRepository.create(dto);
  }

  public async useReferralCode(
    referredBy: UserEntity,
  ): Promise<ReferralCodeEntity> {
    const referredByReferralCode = await this.referralCodeRepository.findOne({
      id: referredBy.referralCode.id,
    });
    referredByReferralCode.timesUsed += 1;
    return await referredByReferralCode.save();
  }

  public generateCode(): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 8) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }
}
