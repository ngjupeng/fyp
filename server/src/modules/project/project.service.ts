import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import {
  CreateProjectBase,
  CreateProjectDto,
  UpdateProjectDto,
} from './project.dto';
import { UserEntity } from '../user/user.entity';
import { ProjectRepository } from './project.repository';
import { ProjectStatusType } from 'src/common/enums/project';
import { SupportedTokenService } from '../supported-token/supported-token.service';
import { isURL } from 'class-validator';
import { isAddress } from 'viem';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly supportedTokenService: SupportedTokenService,
  ) {}

  public async createProject(
    user: UserEntity,
    body: CreateProjectBase,
  ): Promise<void> {
    // check if token address is supported
    const supportedTokenAddress = await this.supportedTokenService.isSupported(
      body.tokenAddress,
    );

    if (!supportedTokenAddress) {
      throw new BadRequestException('Token address is not supported');
    }

    // verify verification dataset is url
    if (!isURL(body.verificationDatasetURL)) {
      throw new BadRequestException('Verification dataset is not a valid url');
    }

    // make sure the agreement address is a valid address and unique
    const agreementAddress = await this.projectRepository.findOne({
      agreementAddress: body.agreementAddress,
    });

    if (agreementAddress) {
      throw new BadRequestException('Agreement address already exists');
    }

    if (!isAddress(body.agreementAddress)) {
      throw new BadRequestException('Agreement address is not a valid address');
    }

    await this.projectRepository.create({
      ...body,
      status: ProjectStatusType.PENDING,
      currentRound: 0,
      creator: user,
    });
  }

  public async updateProject(
    id: string,
    body: UpdateProjectDto,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({ id });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    await this.projectRepository.update(id, body);
  }
}
