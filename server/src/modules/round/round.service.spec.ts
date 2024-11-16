import { Test } from '@nestjs/testing';
import { RoundService } from './round.service';
import { RoundRepository } from './round.repository';
import { ProjectRepository } from '../project/project.repository';
import { ParticipantSubmissionRepository } from './participant-submission.repository';
import { AppConfigService } from '../../common/config/services/config.service';
import { ProjectService } from '../project/project.service';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import { ProjectStatusType } from '../../common/enums/project';
import { UserEntity } from '../user/user.entity';
import { ProjectEntity } from '../project/project.entity';
import { RoundEntity } from './round.entity';
import { PythonShell } from 'python-shell';
import * as path from 'path';
import * as fs from 'fs';
import { MOCK_FRONTEND_URL } from '../../../test/constants';
import { PinataSDK } from 'pinata-web3';

jest.mock('python-shell');
jest.mock('pinata-web3', () => {
  return {
    PinataSDK: class MockPinataSDK {
      pinFileToIPFS = jest
        .fn()
        .mockResolvedValue({ IpfsHash: 'mock-ipfs-hash' });
    },
  };
});
jest.mock('python-shell', () => ({
  PythonShell: {
    run: jest.fn().mockImplementation((scriptPath, options) => {
      // Mock different responses based on the script arguments
      if (options.args[0] === 'homomorphic_addition') {
        return Promise.resolve(['mock-homomorphic-result']);
      }
      if (options.args[0] === 'generate_keypair') {
        return Promise.resolve([
          '{"g": "mock-g", "n": "mock-n", "phi": "mock-phi"}',
        ]);
      }
      if (options.args[0] === 'encrypt') {
        return Promise.resolve(['mock-encrypted-data']);
      }
      if (options.args[0] === 'decrypt') {
        return Promise.resolve(['mock-decrypted-data']);
      }
      return Promise.resolve(['default-mock-result']);
    }),
  },
}));

describe('Round Service', () => {
  let roundService: RoundService;
  let roundRepository: RoundRepository;
  let projectRepository: ProjectRepository;
  let participantSubmissionRepository: ParticipantSubmissionRepository;
  let projectService: ProjectService;
  let appConfigService: AppConfigService;

  const mockUser: Partial<UserEntity> = {
    id: 1,
    email: 'test@example.com',
  };

  const mockProject: Partial<ProjectEntity> = {
    id: 1,
    name: 'Test Project',
    currentRound: 1,
    maximumRounds: 3,
    status: ProjectStatusType.RUNNING,
    agreementAddress: '0x1234567890123456789012345678901234567890',
    initialGlobalModel: 'initial-model-hash',
    save: jest.fn(),
  };

  const mockRound: Partial<RoundEntity> = {
    id: 1,
    roundNumber: 1,
    globalModelIPFSLink: 'ipfs-hash',
    project: mockProject as ProjectEntity,
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RoundService,
        {
          provide: RoundRepository,
          useValue: createMock<RoundRepository>(),
        },
        {
          provide: ProjectRepository,
          useValue: createMock<ProjectRepository>(),
        },
        {
          provide: ParticipantSubmissionRepository,
          useValue: createMock<ParticipantSubmissionRepository>(),
        },
        {
          provide: ProjectService,
          useValue: createMock<ProjectService>(),
        },
        {
          provide: AppConfigService,
          useValue: createMock<AppConfigService>(),
        },
      ],
    }).compile();

    jest.mock('fs', () => ({
      writeFileSync: jest.fn(),
      readFileSync: jest.fn().mockReturnValue('mock-file-content'),
      unlinkSync: jest.fn(),
    }));

    roundService = moduleRef.get<RoundService>(RoundService);
    roundRepository = moduleRef.get<RoundRepository>(RoundRepository);
    projectRepository = moduleRef.get<ProjectRepository>(ProjectRepository);
    participantSubmissionRepository =
      moduleRef.get<ParticipantSubmissionRepository>(
        ParticipantSubmissionRepository,
      );
    projectService = moduleRef.get<ProjectService>(ProjectService);
    appConfigService = moduleRef.get<AppConfigService>(AppConfigService);
  });

  describe('createFirstRound', () => {
    it('should create first round successfully', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest.spyOn(projectRepository, 'updateOne').mockResolvedValue(undefined);
      jest
        .spyOn(roundRepository, 'create')
        .mockResolvedValue(mockRound as RoundEntity);

      await roundService.createFirstRound(1);

      expect(projectRepository.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { currentRound: 2 },
      );
      expect(roundRepository.create).toHaveBeenCalledWith({
        project: mockProject,
        roundNumber: 2,
        globalModelIPFSLink: mockProject.initialGlobalModel,
      });
    });

    it('should throw BadRequestException if project not found', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      await expect(roundService.createFirstRound(999)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create first round with initial global model', async () => {
      const mockProjectWithModel = {
        ...mockProject,
        initialGlobalModel: 'initial-model-hash',
      };

      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProjectWithModel as ProjectEntity);
      jest.spyOn(projectRepository, 'updateOne').mockResolvedValue(undefined);
      jest
        .spyOn(roundRepository, 'create')
        .mockResolvedValue(mockRound as RoundEntity);

      await roundService.createFirstRound(1);

      expect(roundRepository.create).toHaveBeenCalledWith({
        project: mockProjectWithModel,
        roundNumber: 2,
        globalModelIPFSLink: 'initial-model-hash',
      });
    });
  });

  describe('addSubmission', () => {
    const mockSubmissionDto = {
      projectId: 1,
      roundNumber: 1,
      ipfsLink: 'ipfs-hash',
      encryptedParameters: 'encrypted-data',
    };
    const submissionDto = {
      projectId: 1,
      roundNumber: 1,
      ipfsLink: 'ipfs-hash',
      encryptedParameters: 'encrypted-data',
    };

    it('should add submission successfully', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest
        .spyOn(roundRepository, 'findOne')
        .mockResolvedValue(mockRound as RoundEntity);
      jest
        .spyOn(participantSubmissionRepository, 'findOne')
        .mockResolvedValue(null);
      jest
        .spyOn(participantSubmissionRepository, 'create')
        .mockResolvedValue(undefined);

      await roundService.addSubmission(submissionDto, mockUser as UserEntity);

      expect(participantSubmissionRepository.create).toHaveBeenCalledWith({
        participant: mockUser,
        round: mockRound,
        project: mockProject,
        IPFSLink: submissionDto.ipfsLink,
        encryptedParameters: submissionDto.encryptedParameters,
      });
    });

    it('should throw BadRequestException if project not found', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      await expect(
        roundService.addSubmission(submissionDto, mockUser as UserEntity),
      ).rejects.toThrow('Project not found');
    });

    it('should throw if submission already exists', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest
        .spyOn(roundRepository, 'findOne')
        .mockResolvedValue(mockRound as RoundEntity);
      jest
        .spyOn(participantSubmissionRepository, 'findOne')
        .mockResolvedValue({ id: 1 } as any);

      await expect(
        roundService.addSubmission(mockSubmissionDto, mockUser as UserEntity),
      ).rejects.toThrow('Already submitted');
    });

    it('should throw if round not found', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest.spyOn(roundRepository, 'findOne').mockResolvedValue(null);

      await expect(
        roundService.addSubmission(mockSubmissionDto, mockUser as UserEntity),
      ).rejects.toThrow('Round not found');
    });
  });

  describe('getRoundDetail', () => {
    it('should return round details with submissions', async () => {
      const mockSubmissions = [
        { id: 1, participant: mockUser },
        { id: 2, participant: { ...mockUser, id: 2 } },
      ];

      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest
        .spyOn(roundRepository, 'findOne')
        .mockResolvedValue(mockRound as RoundEntity);
      jest
        .spyOn(participantSubmissionRepository, 'find')
        .mockResolvedValue(mockSubmissions as any);

      const result = await roundService.getRoundDetail(1, 1);

      expect(result).toEqual({
        round: mockRound,
        submissions: mockSubmissions,
      });
    });

    it('should throw BadRequestException if project not found', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      await expect(roundService.getRoundDetail(999, 1)).rejects.toThrow(
        'Project not found',
      );
    });

    it('should throw if round not found', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest.spyOn(roundRepository, 'findOne').mockResolvedValue(null);

      await expect(roundService.getRoundDetail(1, 1)).rejects.toThrow(
        'Round not found',
      );
    });
  });

  describe('proceedToNextRound', () => {
    it('should throw BadRequestException if not enough submissions', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest
        .spyOn(participantSubmissionRepository, 'find')
        .mockResolvedValue([{ id: 1 }] as any);

      await expect(roundService.proceedToNextRound('0x1234')).rejects.toThrow(
        'Not enough submissions',
      );
    });
  });

  describe('Python Script Integration', () => {
    it('should handle homomorphic addition correctly', async () => {
      const roundServiceAny = roundService as any;
      const mockArray = ['1', '2', '3'];
      const mockN = 'mock-n';

      PythonShell.run = jest.fn().mockResolvedValue(['mock-result']);

      const result = await roundServiceAny.homomorphicAddition(
        JSON.stringify(mockArray),
        mockN,
      );

      expect(PythonShell.run).toHaveBeenCalledWith(
        expect.stringContaining('phe.py'),
        expect.objectContaining({
          args: ['homomorphic_addition', JSON.stringify(mockArray), mockN],
        }),
      );
      expect(result).toBe('mock-result');
    });

    // it('should handle encryption correctly', async () => {
    //   const roundServiceAny = roundService as any;
    //   const mockArray = ['1', '2', '3'];
    //   const mockG = 'mock-g';
    //   const mockN = 'mock-n';

    //   PythonShell.run = jest.fn().mockResolvedValue(['encrypted-result']);

    //   const result = await roundServiceAny.encryptArray(
    //     JSON.stringify(mockArray),
    //     mockG,
    //     mockN,
    //   );

    //   // Fix: Use exact path and match exact args format
    //   expect(PythonShell.run).toHaveBeenCalledWith(
    //     expect.stringContaining('/scripts/phe.py'),
    //     {
    //       args: [
    //         'encrypt',
    //         `"${JSON.stringify(mockArray)}"`, // Note the extra quotes
    //         mockG,
    //         mockN,
    //       ],
    //     },
    //   );
    //   expect(result).toBe('encrypted-result');
    // });

    it('should handle decryption correctly', async () => {
      const roundServiceAny = roundService as any;
      const mockArray = 'encrypted-data';
      const mockPhi = 'mock-phi';
      const mockN = 'mock-n';

      PythonShell.run = jest.fn().mockResolvedValue(['decrypted-result']);

      const result = await roundServiceAny.decryptArray(
        mockArray,
        mockPhi,
        mockN,
      );

      expect(PythonShell.run).toHaveBeenCalledWith(
        expect.stringContaining('phe.py'),
        expect.objectContaining({
          args: ['decrypt', mockArray, mockPhi, mockN],
        }),
      );
      expect(result).toBe('decrypted-result');
    });

    it('should generate keypair successfully', async () => {
      const mockKeypairResult =
        '{"g": "mock-g", "n": "mock-n", "phi": "mock-phi"}';
      PythonShell.run = jest.fn().mockResolvedValue([mockKeypairResult]);

      const roundServiceAny = roundService as any;
      const result = await roundServiceAny.generateKeypair();

      expect(result).toBe(mockKeypairResult);
      expect(PythonShell.run).toHaveBeenCalledWith(
        expect.stringContaining('phe.py'),
        expect.objectContaining({
          args: ['generate_keypair'],
        }),
      );
    });
  });

  describe('proceedToNextRoundSandbox', () => {
    it('should create test project if none exists', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      const mockNewProject = { ...mockProject, save: jest.fn() };
      jest
        .spyOn(projectRepository, 'create')
        .mockResolvedValue(mockNewProject as any);

      await roundService.proceedToNextRoundSandbox();

      expect(projectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test',
          status: ProjectStatusType.RUNNING,
        }),
      );
    });
  });

  describe('Project Completion', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle project completion when maximum rounds reached', async () => {
      // Setup mock project at final round
      const mockFinalRoundProject = {
        ...mockProject,
        id: 1,
        currentRound: 3,
        maximumRounds: 3,
        g: 'mock-g',
        n: 'mock-n',
        phi: 'mock-phi',
        status: ProjectStatusType.RUNNING,
      };

      const mockSubmissions = [
        { encryptedParameters: 'encrypted1' },
        { encryptedParameters: 'encrypted2' },
        { encryptedParameters: 'encrypted3' },
      ];

      // Mock AppConfigService
      const mockConfigService = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'others') {
            return {
              pinataJwt: 'mock-jwt',
              pinataApiKey: 'mock-api-key',
              pinataApiSecret: 'mock-api-secret',
            };
          }
          return null;
        }),
      };

      PythonShell.run = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve(['mock-homomorphic-result']),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(['mock-decrypted-result']),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(['mock-encrypted-result']),
        );

      // Mock repository methods
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockFinalRoundProject as ProjectEntity);
      jest
        .spyOn(participantSubmissionRepository, 'find')
        .mockResolvedValue(mockSubmissions as any);
      jest.spyOn(roundRepository, 'create').mockResolvedValue(mockRound as any);
      jest
        .spyOn(projectRepository, 'updateOne')
        .mockResolvedValue(mockFinalRoundProject as ProjectEntity);
      jest.spyOn(projectService, 'endProject').mockResolvedValue(undefined);
    });
  });
});
