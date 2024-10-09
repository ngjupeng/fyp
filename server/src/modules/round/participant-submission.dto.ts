import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateParticipantSubmissionDto {
  @ApiProperty({ description: 'The ID of the project' })
  @IsNotEmpty()
  @IsNumber()
  projectId: number;

  @ApiProperty({ description: 'The ID of the round' })
  @IsNotEmpty()
  @IsNumber()
  roundId: number;

  @ApiProperty({ description: 'The IPFS link for the submission' })
  @IsNotEmpty()
  @IsString()
  ipfsLink: string;

  @ApiProperty({
    description: 'The flattened parameters array for the submission',
  })
  @IsNotEmpty()
  @IsArray()
  flattenedParameters: string[];
}

export class ParticipantSubmissionResponseDto extends CreateParticipantSubmissionDto {
  @ApiProperty({ description: 'The ID of the participant' })
  @IsNotEmpty()
  @IsNumber()
  participantId: number;
}
