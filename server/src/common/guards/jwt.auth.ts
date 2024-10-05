import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ErrorAuth, ErrorToken, ErrorUser } from '../constants/errors';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-http') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    // `super` has to be called to set `user` on `request`
    // see https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
    return (super.canActivate(context) as Promise<boolean>).catch((e) => {
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      switch (e.message) {
        case ErrorAuth.TwoFactorAuthDisabled:
          throw new UnauthorizedException(ErrorAuth.TwoFactorAuthDisabled);
        case ErrorAuth.TwoFactorAuthRequired:
          throw new UnauthorizedException(ErrorAuth.TwoFactorAuthRequired);
        case ErrorToken.Expired:
          throw new UnauthorizedException(ErrorToken.Expired);
        case ErrorUser.NoRole:
          throw new UnauthorizedException(ErrorUser.NoRole);
        case ErrorUser.UserNotActive:
          throw new UnauthorizedException(ErrorUser.UserNotActive);
        case ErrorUser.NotFound:
          throw new UnauthorizedException(ErrorUser.NotFound);
        default:
          throw new UnauthorizedException('Unauthorized');
      }
    });
  }
}
