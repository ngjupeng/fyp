import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ParticipantSubmissionEntity } from './participant-submission.entity';
import { RoundEntity } from './round.entity';

export class RoundDto {
  @ApiProperty({ description: 'The project round number' })
  @IsNotEmpty()
  @IsNumber()
  roundNumber: number;

  @ApiProperty({ description: 'The global model IPFS link' })
  @IsNotEmpty()
  @IsString()
  globalModelIPFSLink: string;

  @ApiProperty({ description: 'The project ID' })
  @IsNotEmpty()
  @IsNumber()
  projectId: number;
}

export interface CreateRoundDto
  extends Omit<RoundDto, 'roundNumber' | 'globalModelIPFSLink'> {}

export interface RoundDetailResponseDto {
  round: RoundEntity;
  submissions: ParticipantSubmissionEntity[];
}
