import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  ProjectBase,
  ProjectResponseDto,
  ProjectStatsDto,
} from './project.dto';
import { UserEntity } from '../user/user.entity';
import { ProjectRepository } from './project.repository';
import { ProjectStatusType } from '../../common/enums/project';
import { SupportedTokenService } from '../supported-token/supported-token.service';
import { isURL } from 'class-validator';
import { isAddress } from 'viem';
import { ProjectEntity } from './project.entity';
import { abis } from '../../common/constants/abis';
import { publicClient } from '../../common/viem/public-client';
import { RoundService } from '../round/round.service';
import { RoundEntity } from '../round/round.entity';
import { VerificationRepository } from '../user/verification.repository';
import { MoreThan } from 'typeorm';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  constructor(
    private readonly projectRepository: ProjectRepository,
    @Inject(forwardRef(() => RoundService))
    private readonly roundService: RoundService,
    private readonly verificationRepository: VerificationRepository,
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
      { relations: ['participants', 'creator'] },
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
    // if user not bound wallet
    if (!user.address) {
      throw new BadRequestException('User has no bound wallet');
    }

    // first check if user has a verified identity
    const verifiedIdentity = await this.verificationRepository.find({
      user: { id: user.id },
      count: MoreThan(0),
    });

    if (verifiedIdentity.length < 2) {
      throw new BadRequestException(
        'User has no verified identity, please verify your identity first',
      );
    }

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

    // // check if participants.length is less than maximumParticipantAllowed
    // if (project.participants.length >= project.maximumParticipantAllowed) {
    //   throw new BadRequestException('Project is full');
    // }

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

  public async endProject(agreementAddress: string): Promise<void> {
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
        console.log('WATCH PROJECT FINISH EVENT TRIGGERED!');
        console.log('logs', logs);
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
      { relations: ['rounds', 'creator', 'participants'] },
    );
    return project;
  }

  public async getProjectStats(): Promise<ProjectStatsDto> {
    // get all projects, calculate number of ongoing, pending and completed projects
    const projects = await this.projectRepository.find({});
    const ongoingProjects = projects.filter(
      (project) => project.status === ProjectStatusType.RUNNING,
    );
    const pendingProjects = projects.filter(
      (project) => project.status === ProjectStatusType.PENDING,
    );
    const completedProjects = projects.filter(
      (project) => project.status === ProjectStatusType.COMPLETED,
    );

    return {
      ongoingProjects: ongoingProjects.length,
      pendingProjects: pendingProjects.length,
      completedProjects: completedProjects.length,
    };
  }

  public async getMyProjects(user: UserEntity): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository.find(
      {
        participants: { id: user.id },
      },
      { relations: ['participants', 'creator'] },
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
}
