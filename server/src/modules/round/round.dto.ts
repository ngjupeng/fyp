import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';
import { ParticipantSubmissionEntity } from './participant-submission.entity';
import { RoundEntity } from './round.entity';
import { ProjectEntity } from '../project/project.entity';

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
  @IsObject()
  project: ProjectEntity;
}

export interface CreateRoundDto
  extends Omit<RoundDto, 'roundNumber' | 'globalModelIPFSLink'> {}

export interface RoundDetailResponseDto {
  round: RoundEntity;
  submissions: ParticipantSubmissionEntity[];
}
