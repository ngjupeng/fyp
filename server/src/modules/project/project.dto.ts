import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public verificationDatasetURL: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public tokenAddress: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  public minimumReputation: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  public collateralAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  public totalRewardAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  public maximumParticipantAllowed: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  public maximumRounds: number;
}
