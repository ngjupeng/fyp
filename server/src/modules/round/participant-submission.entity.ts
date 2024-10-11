import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';
import { RoundEntity } from './round.entity';
import { ProjectEntity } from '../project/project.entity';

@Entity({ name: 'participant_submissions' })
export class ParticipantSubmissionEntity extends BaseEntity {
  @ManyToOne(() => UserEntity)
  public participant: UserEntity;

  @ManyToOne(() => RoundEntity, (round) => round.submissions)
  public round: RoundEntity;

  @ManyToOne(() => ProjectEntity, (project) => project.submissions)
  public project: ProjectEntity;

  @Column({ type: 'varchar' })
  public IPFSLink: string;

  @Column({ type: 'text', array: true })
  public encryptedParameters: string[];
}
