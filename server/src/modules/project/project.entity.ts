import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';
import { RoundEntity } from '../round/round.entity';
import { ParticipantSubmissionEntity } from '../round/participant-submission.entity';

@Entity({ name: 'projects' })
export class ProjectEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  public name: string;

  @Column({ type: 'varchar' })
  public description: string;

  @Column({ type: 'varchar' })
  public verificationDatasetURL: string;

  @Column({ type: 'varchar' })
  public tokenAddress: string;

  @Column({ type: 'varchar' })
  public publicKey: string;

  @Column({ type: 'int' })
  public minimumReputation: number;

  @Column({ type: 'int' })
  public collateralAmount: number;

  @Column({ type: 'int' })
  public totalRewardAmount: number;

  @Column({ type: 'int' })
  public maximumParticipantAllowed: number;

  @Column({ type: 'int' })
  public maximumRounds: number;

  @Column({ type: 'int' })
  public currentRound: number;

  @Column({ type: 'varchar', unique: true })
  public agreementAddress?: string;

  @Column({ type: 'varchar' })
  public initialGlobalModel: string; // IPFS hash

  @Column({ type: 'jsonb' })
  public fileStructure: object;

  @JoinColumn()
  @OneToOne(() => UserEntity)
  public creator: UserEntity;

  @ManyToMany(() => UserEntity)
  @JoinTable()
  public participants: UserEntity[];

  @OneToMany(() => RoundEntity, (round) => round.project)
  public rounds: RoundEntity[];

  @OneToMany(
    () => ParticipantSubmissionEntity,
    (submission) => submission.project,
  )
  public submissions: ParticipantSubmissionEntity[];
}
