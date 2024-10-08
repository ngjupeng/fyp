import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { CreateProjectDto } from './project.dto';

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

  public async create(dto: CreateProjectDto): Promise<ProjectEntity> {
    return this.projectEntityRepository.create(dto).save();
  }
}