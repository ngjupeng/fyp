import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { RequestWithUser } from 'src/common/interfaces';
import {
  CreateProjectBase,
  CreateProjectDto,
  UpdateProjectDto,
} from './project.dto';
import { JwtAuthGuard } from 'src/common/guards';

@ApiBearerAuth()
@ApiTags('Project')
@Controller('/project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseGuards(JwtAuthGuard)
  @Post('/create')
  public async createProject(
    @Request() req: RequestWithUser,
    @Body() body: CreateProjectBase,
  ): Promise<any> {
    return this.projectService.createProject(req.user, body);
  }

  // update project configuration
  @ApiOperation({ summary: 'Update project configuration' })
  @ApiResponse({
    status: 200,
    description: 'Project configuration updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseGuards(JwtAuthGuard)
  @Put('/update/:id')
  public async updateProject(
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
  ): Promise<any> {
    return this.projectService.updateProject(id, body);
  }
}
