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
import { RoundService } from './round.service';
import { RoundDetailResponseDto, RoundDto } from './round.dto';
import { CreateParticipantSubmissionDto } from './participant-submission.dto';
import { RequestWithUser } from 'src/common/interfaces/request';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth';

@ApiBearerAuth()
@ApiTags('Round')
@Controller('/round')
export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  // add submission for round
  @ApiOperation({ summary: 'Add a submission for a round' })
  @ApiResponse({ status: 200, description: 'Submission added successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseGuards(JwtAuthGuard)
  @Post('/submission')
  public async addSubmission(
    @Request() req: RequestWithUser,
    @Body() body: CreateParticipantSubmissionDto,
  ): Promise<void> {
    return this.roundService.addSubmission(body, req.user);
  }

  // get round detail and all submission for that round
  @ApiOperation({
    summary: 'Get round detail and all submission for that round',
  })
  @ApiResponse({ status: 200, description: 'Round detail and all submission' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseGuards(JwtAuthGuard)
  @Get('/:projectId/:roundId')
  public async getRoundDetail(
    @Param('projectId') projectId: number,
    @Param('roundId') roundId: number,
  ): Promise<RoundDetailResponseDto> {
    return this.roundService.getRoundDetail(projectId, roundId);
  }

  // proceed next round sandbox
  @ApiOperation({ summary: 'Proceed to next round sandbox' })
  @ApiResponse({
    status: 200,
    description: 'Next round sandbox proceed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/proceed-next-round-sandbox')
  public async proceedNextRoundSandbox() {
    this.roundService.proceedToNextRound();
  }
}
