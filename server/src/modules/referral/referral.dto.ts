import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// create referral code dto
export class ReferralCodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public code: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public timesUsed: number;
}
