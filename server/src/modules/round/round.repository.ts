import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { RoundEntity } from './round.entity';
import { RoundDto } from './round.dto';

@Injectable()
export class RoundRepository {
  private readonly logger = new Logger(RoundRepository.name);

  constructor(
    @InjectRepository(RoundEntity)
    private readonly roundEntityRepository: Repository<RoundEntity>,
  ) {}

  public async findOne(
    where: FindOptionsWhere<RoundEntity>,
    options?: FindOneOptions<RoundEntity>,
  ): Promise<RoundEntity | null> {
    const roundEntity = await this.roundEntityRepository.findOne({
      where,
      ...options,
    });

    return roundEntity;
  }

  public async create(dto: RoundDto): Promise<RoundEntity> {
    return this.roundEntityRepository.create(dto).save();
  }

  public async updateOne(
    where: FindOptionsWhere<RoundEntity>,
    dto: Partial<RoundDto>,
  ): Promise<RoundEntity> {
    const roundEntity = await this.roundEntityRepository.findOneBy(where);

    if (!roundEntity) {
      this.logger.log('none');
      throw new Error();
    }

    Object.assign(roundEntity, dto);
    return roundEntity.save();
  }

  public find(
    where: FindOptionsWhere<RoundEntity>,
    options?: FindManyOptions<RoundEntity>,
  ): Promise<RoundEntity[]> {
    return this.roundEntityRepository.find({
      where,
      ...options,
    });
  }
}
