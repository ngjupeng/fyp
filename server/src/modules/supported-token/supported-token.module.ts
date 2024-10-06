import { Module } from '@nestjs/common';
import { SupportedTokenService } from './supported-token.service';
import { SupportedTokenController } from './supported-token.controller';
import { SupportedTokenRepository } from './supported-token.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportedTokenEntity } from './supported-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupportedTokenEntity])],
  providers: [SupportedTokenService, SupportedTokenRepository],
  exports: [SupportedTokenService],
  controllers: [SupportedTokenController],
})
export class SupportedTokenModule {}
