import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { ProjectEntity } from '../project/project.entity';
import { ParticipantSubmissionEntity } from './participant-submission.entity';

@Entity({ name: 'rounds' })
export class RoundEntity extends BaseEntity {
  @Column({ type: 'int' })
  public roundNumber: number;

  @Column({ type: 'varchar' })
  public globalModelIPFSLink: string;

  @ManyToOne(() => ProjectEntity, (project) => project.rounds)
  public project: ProjectEntity;

  @OneToMany(
    () => ParticipantSubmissionEntity,
    (submission) => submission.round,
  )
  public submissions: ParticipantSubmissionEntity[];
}
