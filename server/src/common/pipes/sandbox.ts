import { Injectable, PipeTransform, ForbiddenException } from '@nestjs/common';
import { AppConfigService } from '../config/services/config.service';

@Injectable()
export class SandboxCheckPipe implements PipeTransform {
  constructor(private readonly appConfigService: AppConfigService) {}

  transform(value: any) {
    const allowsSandbox = this.appConfigService.otherConfig.allowsSandbox;

    if (!allowsSandbox) {
      throw new ForbiddenException('Sandbox endpoints are not allowed');
    }

    return value;
  }
}
