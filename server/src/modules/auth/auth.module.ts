import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthJwtController } from './auth.controller';
import { AuthEntity } from './auth.entity';
import { AuthRepository } from './auth.repository';
import { TokenRepository } from './token.repository';
import { TokenEntity } from './token.entity';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtHttpStrategy } from './strategy';
import { AppConfigService } from '../../common/config/services/config.service';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const appConfigService = new AppConfigService(configService);
        return {
          secret: appConfigService.authConfig.jwt.secret,
          signOptions: {
            expiresIn: appConfigService.authConfig.jwt.accessTokenExpiresIn,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([AuthEntity, TokenEntity]),
    MailModule,
  ],
  providers: [
    JwtHttpStrategy,
    AuthService,
    AuthRepository,
    TokenRepository,
    AppConfigService,
  ],
  controllers: [AuthJwtController],
  exports: [AuthService],
})
export class AuthModule {}
