import { Module } from '@nestjs/common';
import { RoundController } from './round.controller';
import { RoundRepository } from './round.repository';
import { RoundService } from './round.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoundEntity } from './round.entity';
import { ProjectEntity } from '../project/project.entity';
import { ProjectRepository } from '../project/project.repository';
import { ParticipantSubmissionRepository } from './participant-submission.repository';
import { ParticipantSubmissionEntity } from './participant-submission.entity';
import { AppConfigService } from 'src/common/config/services/config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoundEntity,
      ProjectEntity,
      ParticipantSubmissionEntity,
    ]),
  ],
  providers: [
    RoundService,
    RoundRepository,
    ProjectRepository,
    ParticipantSubmissionRepository,
    AppConfigService,
  ],
  controllers: [RoundController],
  exports: [RoundService, RoundRepository],
})
export class RoundModule {}
