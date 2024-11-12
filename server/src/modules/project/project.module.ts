import { forwardRef, Module } from '@nestjs/common';
import { ProjectEntity } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectRepository } from './project.repository';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportedTokenModule } from '../supported-token/supported-token.module';
import { RoundModule } from '../round/round.module';
import { VerificationEntity } from '../user/verification.entity';
import { VerificationRepository } from '../user/verification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, VerificationEntity]),
    forwardRef(() => RoundModule), // Use forwardRef to break the circular dependency
  ],
  providers: [ProjectService, ProjectRepository, VerificationRepository],
  exports: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule {}
