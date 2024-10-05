import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role';

export const Roles = (roles: Role[]) => SetMetadata('roles', roles);
