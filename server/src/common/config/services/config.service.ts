import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthConfig,
  DatabaseConfig,
  MailConfig,
  OthersConfig,
  ServerConfig,
} from '../interfaces.config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get databaseConfig() {
    return this.configService.get<DatabaseConfig>('database');
  }

  get mailConfig() {
    return this.configService.get<MailConfig>('mail');
  }

  get authConfig() {
    return this.configService.get<AuthConfig>('auth');
  }

  get serverConfig() {
    return this.configService.get<ServerConfig>('server');
  }

  get otherConfig() {
    return this.configService.get<OthersConfig>('others');
  }

  get mailgunConfig() {
    return {
      username: 'api',
      key: this.mailConfig.mailgun.apiKey,
    };
  }

  get nodeEnv() {
    return this.configService.get('NODE_ENV');
  }
}
