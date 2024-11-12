import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { VerificationEntity } from './verification.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'providers' })
export class ProviderEntity extends BaseEntity {
  @ApiProperty({ description: 'The unique ID of the provider' })
  @Column({ type: 'varchar', unique: true, nullable: false })
  public providerId: string;

  @ApiProperty({ description: 'The name of the provider' })
  @Column({ type: 'varchar' })
  public name: string;

  @ApiProperty({ description: 'The description of the provider' })
  @Column({ type: 'varchar' })
  public description: string;

  @OneToMany(() => VerificationEntity, (verification) => verification.provider)
  public verifications: VerificationEntity[];
}
