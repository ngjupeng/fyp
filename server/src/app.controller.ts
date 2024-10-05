import { Controller, Get, Redirect, UseGuards } from '@nestjs/common';

import { Public } from './common/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RoleGuard } from './common/guards';
import { AppService } from './app.service';
import { APP } from './common/constants';
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiTags(APP)
@Controller(`/${APP.toLowerCase()}`)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/')
  @Redirect('/api-v1', 301)
  public redirect(): void {}
}
