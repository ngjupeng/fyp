import {
  Body,
  Controller,
  Get,
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
import { ProjectBase, ProjectDto } from './project.dto';
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
    @Body() body: ProjectBase,
  ): Promise<void> {
    return this.projectService.createProject(req.user, body);
  }

  // get all projects
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Projects fetched successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get('/all')
  public async getAllProjects(): Promise<any> {
    return this.projectService.getAllProjects();
  }

  // join project
  @ApiOperation({ summary: 'Join a project' })
  @ApiResponse({ status: 200, description: 'Project joined successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseGuards(JwtAuthGuard)
  @Post('/join/:id')
  public async joinProject(
    @Request() req: RequestWithUser,
    @Param('id') projectId: number,
  ): Promise<void> {
    return this.projectService.joinProject(req.user, projectId);
  }

  // start project
  @ApiOperation({ summary: 'Start a project' })
  @ApiResponse({ status: 200, description: 'Project started successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseGuards(JwtAuthGuard)
  @Post('/start/:id')
  public async startProject(
    @Request() req: RequestWithUser,
    @Param('id') projectId: number,
  ): Promise<any> {
    return this.projectService.startProject(req.user, projectId);
  }

  // get project current round
  @ApiOperation({ summary: 'Get project current round' })
  @ApiResponse({
    status: 200,
    description: 'Project current round fetched successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get('/:id/current-round')
  public async getProjectCurrentRound(
    @Param('id') projectId: number,
  ): Promise<any> {
    return this.projectService.getProjectCurrentRound(projectId);
  }

  // get project details (include all rounds of the project)
  @ApiOperation({ summary: 'Get project details' })
  @ApiResponse({
    status: 200,
    description: 'Project details fetched successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get('/details/:id')
  public async getProjectDetails(@Param('id') projectId: number): Promise<any> {
    return this.projectService.getProjectDetails(projectId);
  }
}
