import { forwardRef, Module } from '@nestjs/common';
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
import { ProjectService } from '../project/project.service';
import { ProjectModule } from '../project/project.module';
import { VerificationEntity } from '../user/verification.entity';
import { VerificationRepository } from '../user/verification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoundEntity,
      ProjectEntity,
      ParticipantSubmissionEntity,
      VerificationEntity,
    ]),
    forwardRef(() => ProjectModule), // Use forwardRef to break the circular dependency
  ],
  providers: [
    RoundService,
    RoundRepository,
    ProjectRepository,
    ParticipantSubmissionRepository,
    AppConfigService,
    ProjectService,
    ProjectRepository,
    VerificationRepository,
  ],
  controllers: [RoundController],
  exports: [RoundService, RoundRepository],
})
export class RoundModule {}
