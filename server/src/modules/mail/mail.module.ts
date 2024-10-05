import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailgunModule } from 'nestjs-mailgun';
import { AppConfigService } from '../../common/config/services/config.service';

@Global()
@Module({
  imports: [
    MailgunModule.forAsyncRoot({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configservice: ConfigService) => {
        const appConfigService = new AppConfigService(configservice);
        return appConfigService.mailgunConfig;
      },
    }),
  ],
  providers: [MailService, AppConfigService],
  exports: [MailService],
})
export class MailModule {}
