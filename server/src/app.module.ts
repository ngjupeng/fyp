import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_PIPE } from '@nestjs/core';
import { HttpValidationPipe } from './common/pipes';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';
import {
  envValidator,
  mailConfig,
  authConfig,
  databaseConfig,
  othersConfig,
  serverConfig,
} from './common/config';
import { ReferralModule } from './modules/referral/referral.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV}`
        : '.env',
      validationSchema: envValidator,
      load: [
        databaseConfig,
        mailConfig,
        authConfig,
        othersConfig,
        serverConfig,
      ],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    DatabaseModule,
    AuthModule,
    ReferralModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
})
export class AppModule {}
