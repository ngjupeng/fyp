import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { RoundRepository } from './round.repository';
import { CreateRoundDto, RoundDetailResponseDto, RoundDto } from './round.dto';
import { ProjectRepository } from '../project/project.repository';
import { CreateParticipantSubmissionDto } from './participant-submission.dto';
import { UserEntity } from '../user/user.entity';
import { ParticipantSubmissionRepository } from './participant-submission.repository';
import { publicClient } from 'src/common/viem/public-client';
import { abis } from 'src/common/constants/abis';
import { ProjectStatusType } from 'src/common/enums/project';
import { PythonShell } from 'python-shell';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Double } from 'typeorm';
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
  public async proceedToNextRound(): Promise<any> {
    // publicClient.watchContractEvent({
    //   address: abis.federatedCore.address as `0x${string}`,
    //   abi: abis.federatedCore.abi.abi,
    //   eventName: 'AgreementProceedNextRound',
    //   onLogs: (logs) => {
    //     console.log(logs);
    //   },
    // });

    // first search for project
    const projectId = 1;

    // get the project
    let project = await this.projectRepository.findOne({
      id: projectId,
    });

    if (!project) {
      // create new project
      project = await this.projectRepository.create({
        name: 'Test',
        description: 'Test',
        initialGlobalModel: 'Test',
        currentRound: 1,
        agreementAddress: '0x0',
        collateralAmount: 1,
        status: ProjectStatusType.RUNNING,
        creator: null,
        participants: [],
        fileStructure: {},
        maximumParticipantAllowed: 5,
        maximumRounds: 5,
        minimumReputation: 1,
        publicKey: '0x0',
        tokenAddress: '0x0',
        totalRewardAmount: 5,
        verificationDatasetURL: 'test',
      });
    }

    try {
      // generate some fake round submission
      const flattenedParametersBeforeEncrypt1 = [1.1, 2.2, 3.3, 4.4, 5.5].join(
        '|',
      );
      const flattenedParametersBeforeEncrypt2 = [1.1, 2.2, 3.3, 4.4, 5.5].join(
        '|',
      );

      console.log(flattenedParametersBeforeEncrypt1);

      let keys = await this.generateKeypair();
      // remove first and last character
      keys = keys.slice(1, -1);
      const keysSplit = keys.split('|');

      const phi = keysSplit[0];
      const g = keysSplit[1];
      const n = keysSplit[2];
      const encryptedArray1 = await this.encryptArray(
        flattenedParametersBeforeEncrypt1,
        g,
        n,
      );
      const encryptedArray2 = await this.encryptArray(
        flattenedParametersBeforeEncrypt2,
        g,
        n,
      );

      const result = await this.homomorphicAddition(
        [encryptedArray1, encryptedArray2].join('&'),
        n,
      );

      const decryptedArrayString = await this.decryptArray(result, phi, n);
      // remove first and last character
      const decryptedArrayStringTrimmed = decryptedArrayString.slice(1, -1);
      const decryptedArray = decryptedArrayStringTrimmed.split('|');
      // convert array of string to float
      const decryptedArrayNumber = decryptedArray.map((value) =>
        parseFloat(value),
      );

      console.log(decryptedArrayNumber);
    } catch (error) {
      console.log(error);
    }
    // console.log(encryptedArray);
    //

    // const encryptedArray = await this.encryptArray(
    //   flattenedParametersBeforeEncrypt,
    // );
    // have python library here to do the homomorphic encryption

    // const submissions = await this.participantSubmissionRepository.create({
    //   participantId: 1,
    //   roundId: 1,
    //   projectId: 1,
    //   ipfsLink: 'test',
    //   flattenedParameters: ['test'],
    // });

    // do homomorphic aggregation
    // search for all round submissions
    // const submissions = await this.participantSubmissionRepository.find({
    //   round: {
    //     project: {
    //       id: projectId,
    //     },
    //     roundNumber: project.currentRound,
    //   },
    // });

    // // extract all flattened parameters
    // const flattenedParameters = submissions.map((submission) => {
    //   return submission.flattenedParameters;
    // });

    // // do homomorphic aggregation

    // // get project current round
    // const currentRound = project.currentRound + 1;

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

    // insert new record
    await this.participantSubmissionRepository.create({
      participantId: user.id,
      roundId: round.id,
      projectId: project.id,
      ipfsLink: body.ipfsLink,
      encryptedParameters: body.encryptedParameters,
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

  private async runPythonScript(
    scriptName: string,
    args: string[],
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      PythonShell.run(path.join(__dirname, scriptName), { args })
        .then((results) => {
          resolve(results ? results[0] : '');
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private async encryptArray(
    array: string,
    g: string,
    n: string,
  ): Promise<string> {
    try {
      const result = await this.runPythonScript('../../scripts/phe.py', [
        'encrypt',
        JSON.stringify(array),
        g,
        n,
      ]);
      return result;
    } catch (error) {
      console.error('Error encrypting array:', error);
      throw error;
    }
  }

  private async decryptArray(
    array: string,
    phi: string,
    n: string,
  ): Promise<string> {
    try {
      const result = await this.runPythonScript('../../scripts/phe.py', [
        'decrypt',
        array,
        phi,
        n,
      ]);
      return result;
    } catch (error) {
      console.error('Error decrypting array:', error);
      throw error;
    }
  }

  private async homomorphicAddition(array: string, n: string): Promise<string> {
    try {
      const result = await this.runPythonScript('../../scripts/phe.py', [
        'homomorphic_addition',
        array,
        n,
      ]);
      return result;
    } catch (error) {
      console.error('Error encrypting array:', error);
      throw error;
    }
  }

  private async generateKeypair(): Promise<string> {
    try {
      const result = await this.runPythonScript('../../scripts/phe.py', [
        'generate_keypair',
      ]);
      return result;
    } catch (error) {
      console.error('Error generating keypair:', error);
      throw error;
    }
  }
}
