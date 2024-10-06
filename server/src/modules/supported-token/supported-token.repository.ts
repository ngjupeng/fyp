import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  FindOneOptions,
  FindManyOptions,
} from 'typeorm';
import { SupportedTokenEntity } from './supported-token.entity';
import { CreateSupportTokenDto } from './supported-token.dto';
@Injectable()
export class SupportedTokenRepository {
  private readonly logger = new Logger(SupportedTokenRepository.name);

  constructor(
    @InjectRepository(SupportedTokenEntity)
    private readonly SupportedTokenEntityRepository: Repository<SupportedTokenEntity>,
  ) {}

  public async findOne(
    where: FindOptionsWhere<SupportedTokenEntity>,
    options?: FindOneOptions<SupportedTokenEntity>,
  ): Promise<SupportedTokenEntity | null> {
    const SupportedTokenEntity =
      await this.SupportedTokenEntityRepository.findOne({
        where,
        ...options,
      });

    return SupportedTokenEntity;
  }

  public find(
    where: FindOptionsWhere<SupportedTokenEntity>,
    options?: FindManyOptions<SupportedTokenEntity>,
  ): Promise<SupportedTokenEntity[]> {
    return this.SupportedTokenEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(
    dto: CreateSupportTokenDto,
  ): Promise<SupportedTokenEntity> {
    return this.SupportedTokenEntityRepository.create(dto).save();
  }
}
