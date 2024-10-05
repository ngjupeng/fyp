import { UserStatus } from '../../common/enums/user';
import { ReferralCodeEntity } from '../referral/referral.entity';
import { Role } from '../../common/enums/role';

export class UserMinimalDto {
  public id: number;
  public email: string;
  public name: string;
  public role: Role;
  public referralCode?: ReferralCodeEntity | null;
}

// this doesnt return any password, secret etc
export class UserWithoutSecretDto {
  public id: number;
  public createdAt: Date;
  public updatedAt: Date;
  public email: string;
  public name: string;
  public role: Role;
  public status: UserStatus;
  public referralCode?: ReferralCodeEntity | null | number;
  public referredBy?: UserMinimalDto | number;
  public isTwoFactorAuthEnabled: boolean;
}
