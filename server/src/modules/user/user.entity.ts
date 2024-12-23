import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';

import { BaseEntity } from '../../database/base.entity';
import { IUser } from '../../common/interfaces';
import { UserStatus } from '../../common/enums/user';
import { Role } from '../../common/enums/role';
import { ReferralCodeEntity } from '../referral/referral.entity';
import { VerificationEntity } from './verification.entity';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity implements IUser {
  @Exclude()
  @Column({ type: 'varchar' })
  public password: string;

  @Column({ type: 'varchar' })
  public name: string;

  @Column({ type: 'varchar', unique: true })
  public email: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  public twoFactorAuthSecret: string | null;

  @Exclude()
  @Column({ type: 'boolean', default: false })
  public isTwoFactorAuthEnabled: boolean;

  @Exclude()
  @Column({ type: 'enum', enum: Role, nullable: true })
  public role: Role | null;

  @Column({ type: 'varchar', unique: true })
  public address: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  public googleEmail: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  public kaggleUsername: string | null;

  @Exclude()
  @Column({
    type: 'enum',
    enum: UserStatus,
  })
  public status: UserStatus;

  @OneToOne(() => ReferralCodeEntity, { nullable: true })
  @JoinColumn()
  public referralCode: ReferralCodeEntity | null;

  @OneToOne(() => UserEntity, { nullable: true })
  @JoinColumn()
  public referredBy: UserEntity | null;

  @OneToMany(() => VerificationEntity, (verification) => verification.user)
  public verifications: VerificationEntity[];
}
