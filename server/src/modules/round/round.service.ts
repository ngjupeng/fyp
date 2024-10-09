import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { RoundRepository } from './round.repository';
import { CreateRoundDto, RoundDetailResponseDto, RoundDto } from './round.dto';
import { ProjectRepository } from '../project/project.repository';
import { CreateParticipantSubmissionDto } from './participant-submission.dto';
import { UserEntity } from '../user/user.entity';
import { ParticipantSubmissionRepository } from './participant-submission.repository';
import { publicClient } from 'src/common/viem/public-client';
import { abis } from 'src/common/constants/abis';

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly participantSubmissionRepository: ParticipantSubmissionRepository,
  ) {}

  public async createFirstRound(projectId: number): Promise<void> {
    // get the project
    const project = await this.projectRepository.findOne({
      id: projectId,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // get the project current round
    const currentRound = project.currentRound;

    // create new round
    await this.roundRepository.create({
      projectId: projectId,
      roundNumber: currentRound + 1,
      globalModelIPFSLink: project.initialGlobalModel,
    });
  }

  // create new round for a project
  // need to watch for the event for creating new round when people calling confirm round state on contract
  public async proceedToNextRound(): Promise<void> {
    publicClient.watchContractEvent({
      address: abis.federatedCore.address as `0x${string}`,
      abi: abis.federatedCore.abi.abi,
      eventName: 'AgreementProceedNextRound',
      onLogs: (logs) => {
        console.log(logs);
      },
    });
    // get the project
    // const project = await this.projectRepository.findOne({
    //   id: projectId,
    // });

    // if (!project) {
    //   throw new Error('Project not found');
    // }

    // // get project current round
    // const currentRound = project.currentRound + 1;

    // // do homomorphic aggregation

    // // upload to IPFS

    // // get ipfs hash

    // // use the ipfs hash as globalModelIPFSLink

    // // create new round
    // const round = await this.roundRepository.create({
    //   projectId: projectId,
    //   roundNumber: currentRound,
    //   globalModelIPFSLink: '',
    // });
  }

  // add submission for round
  public async addSubmission(
    body: CreateParticipantSubmissionDto,
    user: UserEntity,
  ): Promise<void> {
    // search for project
    const project = await this.projectRepository.findOne({
      id: body.projectId,
      participants: {
        id: user.id,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // get the round
    const round = await this.roundRepository.findOne({
      id: body.roundId,
    });

    if (!round) {
      throw new Error('Round not found');
    }

    // check if ady submitted
    const participantSubmission =
      await this.participantSubmissionRepository.findOne({
        project: project,
        round: round,
        participant: user,
      });

    if (participantSubmission) {
      throw new Error('Already submitted');
    }

    // TODO: check flattened parameters length

    // insert new record
    await this.participantSubmissionRepository.create({
      participantId: user.id,
      roundId: round.id,
      projectId: project.id,
      ipfsLink: body.ipfsLink,
      flattenedParameters: body.flattenedParameters,
    });
  }

  // get round detail and all submission for that round
  public async getRoundDetail(
    projectId: number,
    roundId: number,
  ): Promise<RoundDetailResponseDto> {
    // get the project
    const project = await this.projectRepository.findOne({
      id: projectId,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // get the round
    const round = await this.roundRepository.findOne({
      id: roundId,
    });

    if (!round) {
      throw new Error('Round not found');
    }

    // get all submission for that round
    const submissions = await this.participantSubmissionRepository.find({
      round: {
        id: round.id,
      },
      project: {
        id: project.id,
      },
    });

    return {
      round,
      submissions,
    };
  }
}
