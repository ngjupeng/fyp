import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { ProviderEntity } from './provider.entity';

@Injectable()
export class ProviderRepository {
  constructor(
    @InjectRepository(ProviderEntity)
    private readonly providerEntityRepository: Repository<ProviderEntity>,
  ) {}

  public async findAll(): Promise<ProviderEntity[]> {
    return this.providerEntityRepository.find();
  }

  public async findOne(
    where: FindOptionsWhere<ProviderEntity>,
    options?: FindOneOptions<ProviderEntity>,
  ) {
    const providerEntity = await this.providerEntityRepository.findOne({
      where,
      ...options,
    });

    return providerEntity;
  }
}
