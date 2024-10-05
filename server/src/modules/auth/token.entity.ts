import { Column, Entity, Generated, JoinColumn, OneToOne } from 'typeorm';

import { UserEntity } from '../user/user.entity';
import { BaseEntity } from '../../database/base.entity';
import { IToken } from '../../common/interfaces';
import { TokenType } from '../../common/enums/token';

@Entity({ name: 'tokens' })
export class TokenEntity extends BaseEntity implements IToken {
  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  public uuid: string;

  @Column({
    type: 'enum',
    enum: TokenType,
  })
  public tokenType: TokenType;

  @JoinColumn()
  @OneToOne(() => UserEntity)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
