import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { ProjectBase } from './project.dto';
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
      participants: [user],
    });
  }

  public async getAllProjects(): Promise<ProjectEntity[]> {
    return this.projectRepository.find({});
  }

  public async joinProject(user: UserEntity, projectId: number): Promise<void> {
    // get project
    const project = await this.projectRepository.findOne({ id: projectId });

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
    const project = await this.projectRepository.findOne({ id: projectId });

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
    this.roundService.createFirstRound(projectId);
  }

  public async endProject(
    user: UserEntity,
    agreementAddress: string,
  ): Promise<void> {
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

    // only project creator can end the project earlier
    if (project.creator.id !== user.id) {
      throw new BadRequestException('Only the creator can end the project');
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
        console.log(logs);
      },
    });
  }
}
