import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { VerificationEntity } from './verification.entity';
import { VerificationDto } from './verification.dto';

@Injectable()
export class VerificationRepository {
  private readonly logger = new Logger(VerificationRepository.name);

  constructor(
    @InjectRepository(VerificationEntity)
    private readonly verificationEntityRepository: Repository<VerificationEntity>,
  ) {}

  public async create(dto: VerificationDto): Promise<VerificationEntity> {
    return this.verificationEntityRepository.create(dto).save();
  }

  public find(
    where: FindOptionsWhere<VerificationEntity>,
    options?: FindManyOptions<VerificationEntity>,
  ): Promise<VerificationEntity[]> {
    return this.verificationEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async findOne(
    where: FindOptionsWhere<VerificationEntity>,
    options?: FindOneOptions<VerificationEntity>,
  ) {
    const verificationEntity = await this.verificationEntityRepository.findOne({
      where,
      ...options,
    });

    return verificationEntity;
  }

  public async updateOne(
    where: FindOptionsWhere<VerificationEntity>,
    dto: Partial<VerificationDto>,
  ): Promise<VerificationEntity> {
    const verificationEntity = await this.verificationEntityRepository.findOne({
      where,
      relations: ['user', 'provider'],
    });

    if (!verificationEntity) {
      this.logger.log('none');
      throw new Error();
    }

    Object.assign(verificationEntity, dto);
    return verificationEntity.save();
  }

  public async customAggregationSelect(
    selection: string,
    where?: FindOptionsWhere<VerificationEntity>,
  ): Promise<number> {
    const result = await this.verificationEntityRepository
      .createQueryBuilder('verifications')
      .select(selection, 'result')
      .where(where || {})
      .getRawOne();

    return result?.result ? parseFloat(result.result) : 0;
  }
}
