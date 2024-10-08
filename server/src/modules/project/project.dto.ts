import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Min,
} from 'class-validator';
import { ProjectStatusType } from 'src/common/enums/project';
import { UserEntity } from '../user/user.entity';

export class CreateProjectBase {
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
  @IsString()
  @IsNotEmpty()
  public publicKey: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  public minimumReputation: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  public collateralAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  public totalRewardAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  public maximumParticipantAllowed: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  public maximumRounds: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public agreementAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public initialGlobalModel: string;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  public fileStructure: object;
}

export class CreateProjectDto extends CreateProjectBase {
  @ApiProperty()
  @IsEnum(ProjectStatusType)
  @IsNotEmpty()
  public status: ProjectStatusType;

  @ApiProperty()
  @IsNotEmpty()
  public creator: UserEntity;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  public currentRound: number;
}

export class UpdateProjectDto implements Partial<CreateProjectBase> {}
