import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RoundRepository } from './round.repository';
import { RoundDetailResponseDto, RoundDto } from './round.dto';
import { ProjectRepository } from '../project/project.repository';
import { CreateParticipantSubmissionDto } from './participant-submission.dto';
import { UserEntity } from '../user/user.entity';
import { ParticipantSubmissionRepository } from './participant-submission.repository';
import { publicClient } from 'src/common/viem/public-client';
import { abis } from 'src/common/constants/abis';
import { ProjectStatusType } from 'src/common/enums/project';
import { PythonShell } from 'python-shell';
import * as path from 'path';
import { PinataSDK } from 'pinata-web3';
import { AppConfigService } from 'src/common/config/services/config.service';
import { classToPlain } from 'class-transformer';

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly participantSubmissionRepository: ParticipantSubmissionRepository,
    private readonly appConfigService: AppConfigService,
  ) {}

  public async createFirstRound(projectId: number): Promise<void> {
    // get the project
    const project = await this.projectRepository.findOne({
      id: projectId,
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // get the project current round
    const currentRound = project.currentRound;

    // also update project current round
    await this.projectRepository.updateOne(
      { id: projectId },
      { currentRound: currentRound + 1 },
    );

    // create new round
    await this.roundRepository.create({
      project: project,
      roundNumber: currentRound + 1,
      globalModelIPFSLink: project.initialGlobalModel,
    });
  }

  // create new round for a project
  // need to watch for the event for creating new round when people calling confirm round state on contract
  public async watchNextRoundEvent(): Promise<any> {
    publicClient.watchContractEvent({
      address: abis.federatedCore.address as `0x${string}`,
      abi: abis.federatedCore.abi.abi,
      eventName: 'AgreementProceedNextRound',
      onLogs: (logs) => {
        const event = logs[0] as any;
        const agreementAddress = event?.args?.agreement;
        this.proceedToNextRound(agreementAddress);
      },
    });
  }

  private async proceedToNextRound(agreementAddress: string): Promise<any> {
    // get the project
    let project = await this.projectRepository.findOne({
      agreementAddress: agreementAddress,
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    try {
      // get g and n from project record
      const g = project.g;
      const n = project.n;

      // get all round submission for the project
      const submissions = await this.participantSubmissionRepository.find({
        round: {
          project: project,
          roundNumber: project.currentRound,
        },
      });

      if (submissions.length <= 1) {
        throw new BadRequestException('Not enough submissions');
      }

      // extract all encrypted parameters
      const encryptedParameters = submissions.map((submission) => {
        return submission.encryptedParameters;
      });
      console.log(encryptedParameters);

      const result = await this.homomorphicAddition(
        encryptedParameters.join('&'),
        n,
      );

      // prepare IPFS format
      const data = {
        model_name: project.name,
        parameters: result,
      };

      // upload to IPFS
      const pinata = new PinataSDK({
        pinataJwt: this.appConfigService.otherConfig.pinataJwt,
        pinataGateway: 'example-gateway.mypinata.cloud',
      });

      const jsonString = JSON.stringify(data);

      // Create a Blob with the JSON data
      const blob = new Blob([jsonString], { type: 'application/json' });

      // get project current round
      const currentRound = project.currentRound + 1;

      // Create a File object from the Blob
      const file = new File(
        [blob],
        `${project.name}_${currentRound}_model.json`,
        {
          type: 'application/json',
        },
      );

      // Upload to IPFS
      const upload = await pinata.upload.file(file);
      console.log('IPFS upload result:', upload);

      // Get IPFS hash
      const ipfsHash = upload.IpfsHash;

      // Create new round with IPFS hash
      await this.roundRepository.create({
        project: project,
        roundNumber: currentRound,
        globalModelIPFSLink: ipfsHash,
      });
    } catch (BadRequestException) {
      console.log(BadRequestException);
      throw new BadRequestException(BadRequestException);
    }
  }

  public async proceedToNextRoundSandbox(): Promise<any> {
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
        g: '0x0',
        n: '0x0',
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
    } catch (BadRequestException) {
      console.log(BadRequestException);
    }
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
      throw new BadRequestException('Project not found');
    }

    //check if project is in running state
    if (project.status !== ProjectStatusType.RUNNING) {
      throw new BadRequestException('Project is not in running state');
    }

    // get the round
    const round = await this.roundRepository.findOne({
      roundNumber: body.roundNumber,
      project: project,
    });

    if (!round) {
      throw new BadRequestException('Round not found');
    }

    // check if ady submitted
    const participantSubmission =
      await this.participantSubmissionRepository.findOne({
        project: {
          id: project.id,
        },
        round: {
          id: round.id,
        },
        participant: {
          id: user.id,
        },
      });

    if (participantSubmission) {
      throw new BadRequestException('Already submitted');
    }

    // insert new record
    await this.participantSubmissionRepository.create({
      participant: user,
      round: round,
      project: project,
      IPFSLink: body.ipfsLink,
      encryptedParameters: body.encryptedParameters,
    });
  }

  // get round detail and all submission for that round
  public async getRoundDetail(
    projectId: number,
    roundNumber: number,
  ): Promise<RoundDetailResponseDto> {
    // get the project
    const project = await this.projectRepository.findOne({
      id: projectId,
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // get the round
    const round = await this.roundRepository.findOne({
      project: project,
      roundNumber: roundNumber,
    });

    if (!round) {
      throw new BadRequestException('Round not found');
    }

    // get all submission for that round
    const submissions = await this.participantSubmissionRepository.find(
      {
        round: {
          id: round.id,
        },
        project: {
          id: project.id,
        },
      },
      {
        relations: ['participant'],
      },
    );

    return {
      round,
      submissions: classToPlain(submissions) as any,
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
    } catch (BadRequestException) {
      console.log('BadRequestException encrypting array:', BadRequestException);
      throw BadRequestException;
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
    } catch (BadRequestException) {
      console.log('BadRequestException decrypting array:', BadRequestException);
      throw BadRequestException;
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
    } catch (BadRequestException) {
      console.log('BadRequestException encrypting array:', BadRequestException);
      throw BadRequestException;
    }
  }

  private async generateKeypair(): Promise<string> {
    try {
      const result = await this.runPythonScript('../../scripts/phe.py', [
        'generate_keypair',
      ]);
      return result;
    } catch (BadRequestException) {
      console.log(
        'BadRequestException generating keypair:',
        BadRequestException,
      );
      throw BadRequestException;
    }
  }
}
