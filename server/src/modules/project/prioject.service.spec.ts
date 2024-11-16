import { Test } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { ProjectRepository } from './project.repository';
import { RoundService } from '../round/round.service';
import { VerificationRepository } from '../user/verification.repository';
import { createMock } from '@golevelup/ts-jest';
import { UserEntity } from '../user/user.entity';
import { ProjectEntity } from './project.entity';
import { ProjectStatusType } from '../../common/enums/project';
import { BadRequestException } from '@nestjs/common';
import { Role } from '../../common/enums/role';
import { UserStatus } from '../../common/enums/user';
import { ProjectBase } from './project.dto';

describe('Project Service', () => {
  let projectService: ProjectService;
  let projectRepository: ProjectRepository;
  let roundService: RoundService;
  let verificationRepository: VerificationRepository;

  const mockUser: Partial<UserEntity> = {
    id: 1,
    email: 'test@example.com',
    status: UserStatus.ACTIVE,
    role: Role.USER,
    address: '0x123',
  };

  const mockProject: Partial<ProjectEntity> = {
    id: 1,
    name: 'Test Project',
    description: 'Test Description',
    verificationDatasetURL: 'https://example.com/dataset',
    agreementAddress: '0x1234567890123456789012345678901234567890',
    status: ProjectStatusType.PENDING,
    currentRound: 0,
    maximumRounds: 10,
    creator: mockUser as UserEntity,
    participants: [mockUser as UserEntity],
    save: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: ProjectRepository,
          useValue: createMock<ProjectRepository>(),
        },
        {
          provide: RoundService,
          useValue: createMock<RoundService>(),
        },
        {
          provide: VerificationRepository,
          useValue: createMock<VerificationRepository>(),
        },
      ],
    }).compile();

    projectService = moduleRef.get<ProjectService>(ProjectService);
    projectRepository = moduleRef.get<ProjectRepository>(ProjectRepository);
    roundService = moduleRef.get<RoundService>(RoundService);
    verificationRepository = moduleRef.get<VerificationRepository>(
      VerificationRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const projectBase: ProjectBase = {
      name: 'Test Project',
      description: 'Test Description',
      verificationDatasetURL: 'https://example.com/dataset',
      agreementAddress: '0x1234567890123456789012345678901234567890',
      maximumRounds: 10,
      n: '1',
      g: '1',
      minimumReputation: 1,
      collateralAmount: 1,
      totalRewardAmount: 1,
      fileStructure: {},
      maximumParticipantAllowed: 1,
      initialGlobalModel: '',
      isWhitelist: false,
      whitelistedAddress: [],
    };

    it('should validate all required fields', async () => {
      const incompleteProject = {
        name: 'Test Project',
        // missing required fields
      };

      await expect(
        projectService.createProject(
          mockUser as UserEntity,
          incompleteProject as any,
        ),
      ).rejects.toThrow();
    });

    it('should create a project successfully', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(projectRepository, 'create')
        .mockResolvedValue(mockProject as ProjectEntity);

      await projectService.createProject(mockUser as UserEntity, projectBase);

      expect(projectRepository.create).toHaveBeenCalledWith({
        ...projectBase,
        status: ProjectStatusType.PENDING,
        currentRound: 0,
        creator: mockUser,
        participants: [mockUser],
      });
    });

    it('should throw BadRequestException for invalid URL', async () => {
      const invalidProject = {
        ...projectBase,
        verificationDatasetURL: 'invalid-url',
      };

      await expect(
        projectService.createProject(mockUser as UserEntity, invalidProject),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for existing agreement address', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);

      await expect(
        projectService.createProject(mockUser as UserEntity, projectBase),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllProjects', () => {
    it('should return all projects with participant count', async () => {
      jest
        .spyOn(projectRepository, 'find')
        .mockResolvedValue([mockProject as ProjectEntity]);

      const result = await projectService.getAllProjects();

      expect(result).toEqual([
        {
          ...mockProject,
          participants: [],
          participantsCount: 1,
        },
      ]);
    });
  });

  describe('joinProject', () => {
    it('should allow user to join project', async () => {
      const verifiedIdentities = [{ id: 1 }, { id: 2 }];
      const projectWithoutUser = {
        ...mockProject,
        participants: [], // Empty participants array
      };

      jest
        .spyOn(verificationRepository, 'find')
        .mockResolvedValue(verifiedIdentities as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(projectWithoutUser as ProjectEntity);
      jest.spyOn(projectRepository, 'updateOne').mockResolvedValue(undefined);

      await projectService.joinProject(mockUser as UserEntity, 1);

      expect(projectRepository.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { participants: [mockUser] },
      );
    });

    it('should throw BadRequestException if user already joined', async () => {
      const verifiedIdentities = [{ id: 1 }, { id: 2 }];
      const projectWithUser = {
        ...mockProject,
        participants: [mockUser as UserEntity],
      };

      jest
        .spyOn(verificationRepository, 'find')
        .mockResolvedValue(verifiedIdentities as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(projectWithUser as ProjectEntity);

      await expect(
        projectService.joinProject(mockUser as UserEntity, 1),
      ).rejects.toThrow('User already joined the project');
    });

    it('should throw BadRequestException if user has no wallet', async () => {
      const userWithoutWallet = { ...mockUser, address: null };

      await expect(
        projectService.joinProject(userWithoutWallet as UserEntity, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user has insufficient verifications', async () => {
      jest.spyOn(verificationRepository, 'find').mockResolvedValue([]);

      await expect(
        projectService.joinProject(mockUser as UserEntity, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startProject', () => {
    it('should start project successfully', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest.spyOn(projectRepository, 'updateOne').mockResolvedValue(undefined);
      jest.spyOn(roundService, 'createFirstRound').mockResolvedValue(undefined);

      await projectService.startProject(mockUser as UserEntity, 1);

      expect(projectRepository.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { status: ProjectStatusType.RUNNING },
      );
      expect(roundService.createFirstRound).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException if project is already running', async () => {
      const runningProject = {
        ...mockProject,
        status: ProjectStatusType.RUNNING,
      };
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(runningProject as ProjectEntity);

      await expect(
        projectService.startProject(mockUser as UserEntity, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is not creator', async () => {
      const differentUser = { ...mockUser, id: 2 };
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);

      await expect(
        projectService.startProject(differentUser as UserEntity, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project not found', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      await expect(
        projectService.startProject(mockUser as UserEntity, 999),
      ).rejects.toThrow('Project not found');
    });

    it('should create first round after starting project', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);
      jest.spyOn(projectRepository, 'updateOne').mockResolvedValue(undefined);
      const createFirstRoundSpy = jest
        .spyOn(roundService, 'createFirstRound')
        .mockResolvedValue(undefined);

      await projectService.startProject(mockUser as UserEntity, 1);

      expect(createFirstRoundSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('endProject', () => {
    it('should end project successfully', async () => {
      const runningProject = {
        ...mockProject,
        status: ProjectStatusType.RUNNING,
        save: jest.fn().mockResolvedValue(undefined),
      };
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(runningProject as ProjectEntity);

      await projectService.endProject(runningProject.agreementAddress);

      expect(runningProject.save).toHaveBeenCalled();
      expect(runningProject.status).toBe(ProjectStatusType.COMPLETED);
    });

    it('should throw BadRequestException if project is not running', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(mockProject as ProjectEntity);

      await expect(
        projectService.endProject(mockProject.agreementAddress),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project not found', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      await expect(projectService.endProject('0x123')).rejects.toThrow(
        'Project not found',
      );
    });

    it('should update project status and round correctly', async () => {
      const runningProject = {
        ...mockProject,
        status: ProjectStatusType.RUNNING,
        maximumRounds: 5,
        save: jest.fn().mockResolvedValue(undefined),
      };
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(runningProject as ProjectEntity);

      await projectService.endProject(runningProject.agreementAddress);

      expect(runningProject.status).toBe(ProjectStatusType.COMPLETED);
      expect(runningProject.currentRound).toBe(runningProject.maximumRounds);
      expect(runningProject.save).toHaveBeenCalled();
    });
  });

  describe('getProjectStats', () => {
    it('should return correct project statistics', async () => {
      const mockProjects = [
        { ...mockProject, status: ProjectStatusType.RUNNING },
        { ...mockProject, status: ProjectStatusType.PENDING },
        { ...mockProject, status: ProjectStatusType.COMPLETED },
      ];
      jest
        .spyOn(projectRepository, 'find')
        .mockResolvedValue(mockProjects as ProjectEntity[]);

      const result = await projectService.getProjectStats();

      expect(result).toEqual({
        ongoingProjects: 1,
        pendingProjects: 1,
        completedProjects: 1,
      });
    });

    it('should handle empty projects list', async () => {
      jest.spyOn(projectRepository, 'find').mockResolvedValue([]);

      const result = await projectService.getProjectStats();

      expect(result).toEqual({
        ongoingProjects: 0,
        pendingProjects: 0,
        completedProjects: 0,
      });
    });

    it('should count projects by status correctly', async () => {
      const mockProjects = [
        { status: ProjectStatusType.RUNNING },
        { status: ProjectStatusType.RUNNING },
        { status: ProjectStatusType.PENDING },
        { status: ProjectStatusType.COMPLETED },
        { status: ProjectStatusType.COMPLETED },
        { status: ProjectStatusType.COMPLETED },
      ];
      jest
        .spyOn(projectRepository, 'find')
        .mockResolvedValue(mockProjects as ProjectEntity[]);

      const result = await projectService.getProjectStats();

      expect(result).toEqual({
        ongoingProjects: 2,
        pendingProjects: 1,
        completedProjects: 3,
      });
    });
  });

  describe('getMyProjects', () => {
    it("should return user's projects with participant count", async () => {
      jest
        .spyOn(projectRepository, 'find')
        .mockResolvedValue([mockProject as ProjectEntity]);

      const result = await projectService.getMyProjects(mockUser as UserEntity);

      expect(result).toEqual([
        {
          ...mockProject,
          participants: [],
          participantsCount: 1,
        },
      ]);
    });

    it('should return empty array when user has no projects', async () => {
      jest.spyOn(projectRepository, 'find').mockResolvedValue([]);

      const result = await projectService.getMyProjects(mockUser as UserEntity);

      expect(result).toEqual([]);
    });
  });

  describe('getProjectCurrentRound', () => {
    it('should return null if currentRound is 0', async () => {
      const projectWithNoRounds = { ...mockProject, currentRound: 0 };
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(projectWithNoRounds as ProjectEntity);

      const result = await projectService.getProjectCurrentRound(1);
      expect(result).toBeNull();
    });

    it('should return current round', async () => {
      const mockRound = { id: 1, roundNumber: 1 };
      const projectWithRounds = {
        ...mockProject,
        currentRound: 1,
        rounds: [mockRound],
      };
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(projectWithRounds as ProjectEntity);

      const result = await projectService.getProjectCurrentRound(1);
      expect(result).toEqual(mockRound);
    });
  });

  describe('getProjectDetails', () => {
    it('should return project with all relations', async () => {
      const projectWithRelations = {
        ...mockProject,
        rounds: [{ id: 1 }],
        creator: { id: 1, email: 'creator@test.com' },
        participants: [{ id: 1, email: 'participant@test.com' }],
      };
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue(projectWithRelations as ProjectEntity);

      const result = await projectService.getProjectDetails(1);
      expect(result).toEqual(projectWithRelations);
      expect(projectRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { relations: ['rounds', 'creator', 'participants'] },
      );
    });
  });
});
