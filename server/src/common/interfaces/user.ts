import { Role } from '../enums/role';
import { UserStatus } from '../enums/user';
import { IBase } from './base';

export interface IUser extends IBase {
  name: string;
  password: string;
  email: string;
  status: UserStatus;
  role: Role | null;
}
