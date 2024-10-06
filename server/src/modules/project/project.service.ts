import { Injectable, Logger } from '@nestjs/common';

import { AppConfigService } from '../../common/config/services/config.service';
import { CreateProjectDto } from './project.dto';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  constructor(private readonly appConfigService: AppConfigService) {}

  public async createProject(
    user: UserEntity,
    body: CreateProjectDto,
  ): Promise<any> {}
}
