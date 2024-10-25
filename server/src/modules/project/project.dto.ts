import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  Min,
} from 'class-validator';
import { ProjectStatusType } from 'src/common/enums/project';
import { UserEntity } from '../user/user.entity';
import { ProjectEntity } from './project.entity';

export class ProjectBase {
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
  public n: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public g: string;

  @ApiProperty()
  @IsNotEmpty()
  // @Min(0)
  public minimumReputation: number;

  @ApiProperty()
  @IsNotEmpty()
  // @Min(0)
  public collateralAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  // @Min(0)
  public totalRewardAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  // @Min(1)
  public maximumParticipantAllowed: number;

  @ApiProperty()
  @IsNotEmpty()
  // @Min(1)
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

export class ProjectDto extends ProjectBase {
  @ApiProperty()
  @IsEnum(ProjectStatusType)
  @IsNotEmpty()
  public status: ProjectStatusType;

  @ApiProperty()
  @IsNotEmpty()
  public creator: UserEntity;

  @ApiProperty()
  @IsNotEmpty()
  public currentRound: number;

  @ApiProperty({ type: [UserEntity] })
  @IsArray()
  public participants: UserEntity[];
}

export class ProjectResponseDto extends ProjectEntity {
  public participantsCount: number;
}

export class ProjectStatsDto {
  public ongoingProjects: number;
  public pendingProjects: number;
  public completedProjects: number;
}
