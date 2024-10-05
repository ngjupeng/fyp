import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfigService } from '../config/services/config.service';

@Injectable()
export class ReferralCodeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly appConfigService: AppConfigService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiresReferral =
      this.appConfigService.otherConfig.requireSignupWithReferral;
    const request = context.switchToHttp().getRequest();
    const { referral } = request.body;

    if (!requiresReferral) {
      if (referral) {
        throw new BadRequestException('Referral code is not required');
      }
      return true;
    } else {
      if (!referral) {
        throw new BadRequestException('Referral code is required');
      }
    }

    return true;
  }
}
