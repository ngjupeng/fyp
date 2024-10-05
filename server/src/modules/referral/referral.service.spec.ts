import { Test, TestingModule } from '@nestjs/testing';
import { ReferralCodeService } from './referral.service';
import { ReferralCodeRepository } from './referral.repository';
import { ReferralCodeEntity } from './referral.entity';
import { UserEntity } from '../user/user.entity';
import { createMock } from '@golevelup/ts-jest';
import { AppConfigService } from '../../common/config/services/config.service';

describe('ReferralCodeService', () => {
  let service: ReferralCodeService;
  let referralCodeRepository: ReferralCodeRepository;

  beforeEach(async () => {
    const mockAppConfigService: Partial<AppConfigService> = {
      otherConfig: {
        requireSignupWithReferral: true,
        allowedDomains: 'http://localhost:3000',
        referralCodeMaximumUsage: 2,
        defaultRole: 'user',
        allowsSandbox: true,
        frontendUrl: 'http://localhost:3000',
        require2FA: true,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralCodeService,
        AppConfigService,
        {
          provide: ReferralCodeRepository,
          useValue: createMock<ReferralCodeRepository>(),
        },
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    }).compile();

    service = module.get<ReferralCodeService>(ReferralCodeService);
    referralCodeRepository = module.get<ReferralCodeRepository>(
      ReferralCodeRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new referral code', async () => {
      const dto = { code: 'ABC12345', timesUsed: 0 };
      const expectedResult = new ReferralCodeEntity();
      expectedResult.code = dto.code;
      expectedResult.timesUsed = dto.timesUsed;
      jest
        .spyOn(referralCodeRepository, 'create')
        .mockResolvedValue(expectedResult);

      const result = await service.create(dto);

      expect(result).toEqual(expectedResult);
      expect(referralCodeRepository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw error if referral code already exists', async () => {
      const dto = { code: 'ABC12345', timesUsed: 0 };
      jest
        .spyOn(referralCodeRepository, 'create')
        .mockRejectedValue(new Error('Referral code already exists'));

      await expect(service.create(dto)).rejects.toThrow(
        'Referral code already exists',
      );
    });
  });

  describe('useReferralCode', () => {
    it('should increment timesUsed for a referral code', async () => {
      const referralCode = new ReferralCodeEntity();
      referralCode.id = 1;
      referralCode.timesUsed = 0;
      referralCode.code = 'ABC12345';
      referralCode.save = jest.fn().mockResolvedValue(referralCode);

      jest
        .spyOn(referralCodeRepository, 'findOne')
        .mockResolvedValue(referralCode);

      const referredBy = new UserEntity();
      referredBy.referralCode = { id: 1 } as ReferralCodeEntity;

      const result = await service.useReferralCode(referredBy);

      expect(result.timesUsed).toBe(1);
      expect(referralCode.save).toHaveBeenCalled();
      expect(referralCodeRepository.findOne).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('generateCode', () => {
    it('should generate a code of length 8', () => {
      const code = service.generateCode();
      expect(code.length).toBe(8);
    });

    it('should generate a code containing only uppercase letters and numbers', () => {
      const code = service.generateCode();
      expect(code).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('should generate unique codes', () => {
      const code1 = service.generateCode();
      const code2 = service.generateCode();
      expect(code1).not.toEqual(code2);
    });
  });
});
