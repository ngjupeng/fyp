import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../database/base.entity';

@Entity({ name: 'supported_tokens' })
export class SupportedTokenEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true, nullable: false })
  public name: string;

  @Column({ type: 'varchar', nullable: false })
  public imageUrl: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  public address: string;
}
