import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { ProjectDto } from './project.dto';

@Injectable()
export class ProjectRepository {
  private readonly logger = new Logger(ProjectRepository.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectEntityRepository: Repository<ProjectEntity>,
  ) {}

  public async findOne(
    where: FindOptionsWhere<ProjectEntity>,
    options?: FindOneOptions<ProjectEntity>,
  ): Promise<ProjectEntity | null> {
    const projectEntity = await this.projectEntityRepository.findOne({
      where,
      ...options,
    });

    return projectEntity;
  }

  public async create(dto: ProjectDto): Promise<ProjectEntity> {
    return this.projectEntityRepository.create(dto).save();
  }

  public async updateOne(
    where: FindOptionsWhere<ProjectEntity>,
    dto: Partial<ProjectDto>,
  ): Promise<ProjectEntity> {
    const projectEntity = await this.projectEntityRepository.findOneBy(where);

    if (!projectEntity) {
      this.logger.log('none');
      throw new Error();
    }

    Object.assign(projectEntity, dto);
    return projectEntity.save();
  }

  public find(
    where: FindOptionsWhere<ProjectEntity>,
    options?: FindManyOptions<ProjectEntity>,
  ): Promise<ProjectEntity[]> {
    return this.projectEntityRepository.find({
      where,
      ...options,
    });
  }
}
