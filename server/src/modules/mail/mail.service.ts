import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ErrorMail } from '../../common/constants/errors';
import { Address } from 'nodemailer/lib/mailer';
import { MailgunMessageData, MailgunService } from 'nestjs-mailgun';
import { AppConfigService } from '../../common/config/services/config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mailgundefaultFromEmail: string | Address;
  private readonly mailgundefaultFromName: string;

  constructor(
    private mailgunService: MailgunService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.mailgundefaultFromEmail =
      this.appConfigService.mailConfig.mailgun.from.email;
    this.mailgundefaultFromName =
      this.appConfigService.mailConfig.mailgun.from.name;
  }

  async sendEmail({
    to,
    ...filledTemplate
  }: MailgunMessageData): Promise<void> {
    try {
      const domain = this.appConfigService.mailConfig.mailgun.domain;
      const data: MailgunMessageData = {
        from: `"${this.mailgundefaultFromName}" ${this.mailgundefaultFromEmail}`,
        to,
        ...filledTemplate,
      };
      await this.mailgunService.createEmail(domain, data);
      this.logger.log('Email sent successfully');
      return;
    } catch (error) {
      this.logger.error(error, MailService.name);
      throw new BadRequestException(ErrorMail.EmailNotSent);
    }
  }
}
