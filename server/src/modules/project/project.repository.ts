import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
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
  ): Promise<ProjectEntity | null> {
    const projectEntity = await this.projectEntityRepository.findOne({
      where,
      relations: ['user', 'user.referredBy'],
    });

    return projectEntity;
  }

  public async create(dto: CreateProjectDto): Promise<ProjectEntity> {
    return this.projectEntityRepository.create(dto).save();
  }
}
