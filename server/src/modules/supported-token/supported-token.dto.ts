import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSupportTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public imageUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public address: string;
}
