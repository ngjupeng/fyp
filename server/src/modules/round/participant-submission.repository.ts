import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ParticipantSubmissionEntity } from './participant-submission.entity';
import { CreateParticipantSubmissionDto } from './participant-submission.dto';

@Injectable()
export class ParticipantSubmissionRepository {
  private readonly logger = new Logger(ParticipantSubmissionRepository.name);

  constructor(
    @InjectRepository(ParticipantSubmissionEntity)
    private readonly participantSubmissionEntityRepository: Repository<ParticipantSubmissionEntity>,
  ) {}

  public async findOne(
    where: FindOptionsWhere<ParticipantSubmissionEntity>,
  ): Promise<ParticipantSubmissionEntity | null> {
    const participantSubmissionEntity =
      await this.participantSubmissionEntityRepository.findOne({
        where,
        relations: ['project'],
      });

    return participantSubmissionEntity;
  }

  public async create(
    dto: CreateParticipantSubmissionDto,
  ): Promise<ParticipantSubmissionEntity> {
    return this.participantSubmissionEntityRepository.create(dto).save();
  }
}
