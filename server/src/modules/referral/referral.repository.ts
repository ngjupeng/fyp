import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, FindOneOptions, Repository } from 'typeorm';
import { ReferralCodeEntity } from './referral.entity';
import { ReferralCodeDto } from './referral.dto';

@Injectable()
export class ReferralCodeRepository {
  private readonly logger = new Logger(ReferralCodeRepository.name);

  constructor(
    @InjectRepository(ReferralCodeEntity)
    private readonly referralCodeEntityRepository: Repository<ReferralCodeEntity>,
  ) {}

  public async findOne(
    where: FindOptionsWhere<ReferralCodeEntity>,
    options?: FindOneOptions<ReferralCodeEntity>,
  ): Promise<ReferralCodeEntity | null> {
    const referralCodeEntity = await this.referralCodeEntityRepository.findOne({
      where,
      ...options,
    });

    return referralCodeEntity;
  }

  public async create(dto: ReferralCodeDto): Promise<ReferralCodeEntity> {
    return this.referralCodeEntityRepository.create(dto).save();
  }
}
