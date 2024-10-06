import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { RequestWithUser } from 'src/common/interfaces';
import { CreateProjectDto } from './project.dto';

@ApiBearerAuth()
@ApiTags('Project')
@Controller('/project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('/create')
  public async createProject(
    @Request() req: RequestWithUser,
    @Body() body: CreateProjectDto,
  ): Promise<any> {
    return this.projectService.createProject(req.user, body);
  }
}
