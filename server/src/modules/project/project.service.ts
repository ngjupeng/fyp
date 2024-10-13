import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { ProjectBase, ProjectResponseDto } from './project.dto';
import { UserEntity } from '../user/user.entity';
import { ProjectRepository } from './project.repository';
import { ProjectStatusType } from 'src/common/enums/project';
import { SupportedTokenService } from '../supported-token/supported-token.service';
import { isURL } from 'class-validator';
import { isAddress } from 'viem';
import { ProjectEntity } from './project.entity';
import { abis } from 'src/common/constants/abis';
import { publicClient } from 'src/common/viem/public-client';
import { RoundService } from '../round/round.service';
import { RoundEntity } from '../round/round.entity';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly supportedTokenService: SupportedTokenService,
    private readonly roundService: RoundService,
  ) {}

  public async createProject(
    user: UserEntity,
    body: ProjectBase,
  ): Promise<void> {
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
      participants: [user],
    });
  }

  public async getAllProjects(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository.find(
      {},
      { relations: ['participants'] },
    );

    return projects.map(
      (project) =>
        ({
          ...project,
          participants: [],
          participantsCount: project.participants.length,
        }) as ProjectResponseDto,
    );
  }

  public async joinProject(user: UserEntity, projectId: number): Promise<void> {
    // get project
    const project = await this.projectRepository.findOne(
      { id: projectId },
      { relations: ['participants'] },
    );

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // check if project is running
    if (project.status === ProjectStatusType.RUNNING) {
      throw new BadRequestException('Project is already running');
    }

    // check if participants.length is less than maximumParticipantAllowed
    if (project.participants.length >= project.maximumParticipantAllowed) {
      throw new BadRequestException('Project is full');
    }

    // check if user has already joined the project
    const userJoined = project.participants.some(
      (participant) => participant.id === user.id,
    );

    if (userJoined) {
      throw new BadRequestException('User already joined the project');
    }

    // add user to participants
    project.participants.push(user);

    // update the project using the repository's updateOne method
    await this.projectRepository.updateOne(
      { id: projectId },
      { participants: project.participants },
    );
  }

  public async startProject(
    user: UserEntity,
    projectId: number,
  ): Promise<void> {
    // get project
    const project = await this.projectRepository.findOne(
      { id: projectId },
      { relations: ['creator'] },
    );

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // check if project is already running
    if (project.status === ProjectStatusType.RUNNING) {
      throw new BadRequestException('Project is already running');
    }

    // need the caller to be the creator of the project
    if (project.creator.id !== user.id) {
      throw new BadRequestException('Only the creator can start the project');
    }

    // update the project status to started
    await this.projectRepository.updateOne(
      { id: projectId },
      { status: ProjectStatusType.RUNNING },
    );

    // create first round
    await this.roundService.createFirstRound(projectId);
  }

  private async endProject(agreementAddress: string): Promise<void> {
    // get project
    const project = await this.projectRepository.findOne({
      agreementAddress,
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // check if project is running
    if (project.status !== ProjectStatusType.RUNNING) {
      throw new BadRequestException('Project is not running');
    }

    project.status = ProjectStatusType.COMPLETED;
    project.currentRound = project.maximumRounds;
    await project.save();
  }

  // need to watch for the event for updating project status to completed
  public async watchProjectFinishEvent(): Promise<void> {
    // get project
    publicClient.watchContractEvent({
      address: abis.federatedCore.address as `0x${string}`,
      abi: abis.federatedCore.abi.abi,
      eventName: 'AgreementFinished',
      onLogs: (logs) => {
        const event = logs[0] as any;
        const agreementAddress = event?.args?.agreement;
        this.endProject(agreementAddress);
      },
    });
  }

  public async getProjectCurrentRound(projectId: number): Promise<RoundEntity> {
    const project = await this.projectRepository.findOne(
      { id: projectId },
      { relations: ['rounds'] },
    );
    // acess rounds array by index of currentRound - 1
    // first check if round is 0
    if (project.currentRound === 0) {
      return null;
    }

    return project.rounds[project.currentRound - 1];
  }

  public async getProjectDetails(projectId: number): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne(
      { id: projectId },
      { relations: ['rounds'] },
    );
    return project;
  }
}
