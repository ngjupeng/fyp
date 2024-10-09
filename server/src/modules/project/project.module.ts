import { Module } from '@nestjs/common';
import { ProjectEntity } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectRepository } from './project.repository';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportedTokenModule } from '../supported-token/supported-token.module';
import { RoundModule } from '../round/round.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity]),
    SupportedTokenModule,
    RoundModule,
  ],
  providers: [ProjectService, ProjectRepository],
  exports: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule {}
