import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { UserEntity } from '../user/user.entity';
import { ProjectEntity } from '../project/project.entity';
import { RoundEntity } from './round.entity';

export class CreateParticipantSubmissionDto {
  @ApiProperty({ description: 'The ID of the project' })
  @IsNotEmpty()
  @IsNumber()
  projectId: number;

  @ApiProperty({ description: 'The ID of the round' })
  @IsNotEmpty()
  @IsNumber()
  roundNumber: number;

  @ApiProperty({ description: 'The IPFS link for the submission' })
  @IsNotEmpty()
  @IsString()
  ipfsLink: string;

  @ApiProperty({
    description: 'The flattened parameters array for the submission',
  })
  @IsNotEmpty()
  @IsString()
  encryptedParameters: string;
}

export class ParticipantSubmissionResponseDto {
  @ApiProperty({ description: 'The ID of the project' })
  @IsNotEmpty()
  project: ProjectEntity;

  @ApiProperty({ description: 'The ID of the round' })
  @IsNotEmpty()
  round: RoundEntity;

  @ApiProperty({ description: 'The IPFS link for the submission' })
  @IsNotEmpty()
  @IsString()
  IPFSLink: string;

  @ApiProperty({
    description: 'The flattened parameters array for the submission',
  })
  @IsNotEmpty()
  @IsArray()
  encryptedParameters: string[];

  @ApiProperty({ description: 'The ID of the participant' })
  @IsNotEmpty()
  participant: UserEntity;
}

export class ParticipantSubmissionDto {
  @ApiProperty({ description: 'The ID of the project' })
  @IsNotEmpty()
  project: ProjectEntity;

  @ApiProperty({ description: 'The ID of the round' })
  @IsNotEmpty()
  round: RoundEntity;

  @ApiProperty({ description: 'The IPFS link for the submission' })
  @IsNotEmpty()
  @IsString()
  IPFSLink: string;

  @ApiProperty({
    description: 'The flattened parameters array for the submission',
  })
  @IsNotEmpty()
  @IsString()
  encryptedParameters: string;

  @ApiProperty({ description: 'The ID of the participant' })
  @IsNotEmpty()
  participant: UserEntity;
}
