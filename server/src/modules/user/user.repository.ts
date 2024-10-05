import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';

import { UserEntity } from './user.entity';
import { UserDto } from './user.dto';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
  ) {}

  public async updateOne(
    where: FindOptionsWhere<UserEntity>,
    dto: Partial<UserDto>,
  ): Promise<UserEntity> {
    const userEntity = await this.userEntityRepository.findOneBy(where);

    if (!userEntity) {
      this.logger.log('none');
      throw new Error();
    }

    Object.assign(userEntity, dto);
    return userEntity.save();
  }

  public async findOne(
    where: FindOptionsWhere<UserEntity>,
    options?: FindOneOptions<UserEntity>,
  ): Promise<UserEntity | null> {
    const userEntity = await this.userEntityRepository.findOne({
      where,
      ...options,
    });

    return userEntity;
  }

  public find(
    where: FindOptionsWhere<UserEntity>,
    options?: FindManyOptions<UserEntity>,
  ): Promise<UserEntity[]> {
    return this.userEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(dto: UserDto): Promise<UserEntity> {
    return this.userEntityRepository.create(dto).save();
  }
}
