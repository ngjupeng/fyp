import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { BadRequestException } from '@nestjs/common';
import { MailgunService } from 'nestjs-mailgun';
import { MAIL_TEMPLATES } from '../../common/constants';
import { AppConfigService } from '../../common/config/services/config.service';

describe('MailService', () => {
  let service: MailService;
  let mockMailgunService;

  beforeEach(async () => {
    const mockAppConfigService: Partial<AppConfigService> = {
      mailConfig: {
        mailgun: {
          domain: 'example.com',
          apiKey: '',
          from: {
            email: 'from@gmail.com',
            name: 'from',
          },
        },
        resendInterval: 30000,
      },
    };

    mockMailgunService = {
      createEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailgunService,
          useValue: mockMailgunService,
        },
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      mockMailgunService.createEmail.mockResolvedValueOnce({});
      const filledTemplate = MAIL_TEMPLATES.verification(
        `http://localhost:3000/verify-email?token=123`,
      );
      await expect(
        service.sendEmail({
          to: 'test@gmail.com',
          ...filledTemplate,
        }),
      ).resolves.not.toThrow();

      expect(mockMailgunService.createEmail).toHaveBeenCalledWith(
        'example.com',
        {
          from: `"from" from@gmail.com`,
          to: 'test@gmail.com',
          ...filledTemplate,
        },
      );
    });

    it('should throw BadRequestException when email sending fails', async () => {
      mockMailgunService.createEmail.mockRejectedValueOnce(
        new Error('Failed to send email'),
      );
      const filledTemplate = MAIL_TEMPLATES.verification(
        `http://localhost:3000/verify-email?token=123`,
      );
      await expect(
        service.sendEmail({
          to: 'test@gmail.com',
          ...filledTemplate,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
