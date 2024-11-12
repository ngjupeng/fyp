import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProviderEntity } from './provider.entity';
import { UserEntity } from '../user/user.entity';

//=============================================================================
// for requestProof endpoint
//=============================================================================

export class RequestProofResponseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  requestUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  statusUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class VerificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty()
  @IsNotEmpty()
  user: UserEntity;

  @ApiProperty()
  @IsNotEmpty()
  provider: ProviderEntity;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  verified: boolean;

  @ApiProperty()
  @IsNotEmpty()
  count: number;
}

//=============================================================================
// for reclaim verificationCallback endpoint
//=============================================================================

export class VerificationCallbackDtoParsed {
  identifier: string;
  claimData: {
    provider: string;
    parameters: string; // this is a JSON
    owner: string;
    timestampS: number;
    context: string; // this is a JSON
    identifier: string;
    epoch: number;
  };
  signatures: string[];
  witnesses: {
    id: string;
    url: string;
  }[];
  publicData: Record<string, any>;
}

export class VerificationCallbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;
}
