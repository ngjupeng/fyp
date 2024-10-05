import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { Length } from 'class-validator';

@Entity({ name: 'referral_codes' })
export class ReferralCodeEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 8, unique: true })
  @Length(8, 8)
  public code: string;

  @Column({ type: 'int', default: 0 })
  public timesUsed: number;
}
