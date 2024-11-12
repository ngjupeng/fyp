import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UserEntity } from '../modules/user/user.entity';
import { AuthEntity } from '../modules/auth/auth.entity';
import { TokenEntity } from '../modules/auth/token.entity';
import { APP } from '../common/constants';
import { AppConfigService } from '../common/config/services/config.service';
import { ReferralCodeEntity } from '../modules/referral/referral.entity';
import { ProjectEntity } from 'src/modules/project/project.entity';
import { RoundEntity } from 'src/modules/round/round.entity';
import { ParticipantSubmissionEntity } from 'src/modules/round/participant-submission.entity';
import { SupportedTokenEntity } from 'src/modules/supported-token/supported-token.entity';
import { ProviderEntity } from 'src/modules/user/provider.entity';
import { VerificationEntity } from 'src/modules/user/verification.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        // typeOrmLoggerService: TypeOrmLoggerService,
        configService: ConfigService,
      ) => {
        const appConfigService = new AppConfigService(configService);
        // typeOrmLoggerService.setOptions('all');
        return {
          name: 'default',
          type: 'postgres',
          entities: [
            UserEntity,
            AuthEntity,
            TokenEntity,
            ReferralCodeEntity,
            ProjectEntity,
            SupportedTokenEntity,
            RoundEntity,
            ParticipantSubmissionEntity,
            ProviderEntity,
            VerificationEntity,
          ],
          // We are using migrations, synchronize should be set to false.
          synchronize: false,
          // Run migrations automatically,
          // you can disable this if you prefer running migration manually.
          migrationsTableName: APP,
          migrationsTransactionMode: 'each',
          namingStrategy: new SnakeNamingStrategy(),
          logging:
            appConfigService.nodeEnv === 'development' ||
            appConfigService.nodeEnv === 'staging',
          // Allow both start:prod and start:dev to use migrations
          // __dirname is either dist or server folder, meaning either
          // the compiled js in prod or the ts in dev.
          migrations: [path.join(__dirname, '/migrations/**/*{.ts,.js}')],
          //"migrations": ["dist/migrations/*{.ts,.js}"],
          //   logger: typeOrmLoggerService,
          host: appConfigService.databaseConfig.host,
          port: appConfigService.databaseConfig.port,
          username: appConfigService.databaseConfig.username,
          password: appConfigService.databaseConfig.password,
          database: appConfigService.databaseConfig.database,
          keepConnectionAlive: appConfigService.nodeEnv === 'test',
          migrationsRun: false,
          ssl: appConfigService.databaseConfig.ssl.require
            ? {
                rejectUnauthorized: false,
                require: appConfigService.databaseConfig.ssl.require === true,
              }
            : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
