import { ApiProperty } from '@nestjs/swagger';
import { Matches, IsString, IsEmail, IsBoolean } from 'class-validator';
import { IsConfirm, IsPassword } from '../../common/validators';
import { Transform } from 'class-transformer';
import { TokenType } from '../../common/enums/token';
import { UserEntity } from '../user/user.entity';
import { Role } from '../../common/enums/role';
export class ValidatePasswordDto {
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
    message:
      'Password is not strong enough. Password must be at least eight characters long and contain 1 upper, 1 lowercase, 1 number and 1 special character.',
  })
  @ApiProperty()
  @IsPassword()
  public password: string;

  @ApiProperty()
  @IsConfirm()
  public confirm: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
}

export class TokenCreateDto {
  public tokenType: TokenType;
  public user: UserEntity;
}
export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  public token: string;
}

export class RestorePasswordDto extends ValidatePasswordDto {
  @ApiProperty()
  @IsString()
  public token: string;
}

export class SignInDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;

  @ApiProperty()
  @IsString()
  public password: string;
}

export class TwoFaAuthDto {
  @ApiProperty()
  @IsString()
  public code: string;
}

export class AuthDto {
  @ApiProperty()
  @IsString()
  public accessToken: string;

  @ApiProperty()
  @IsString()
  public refreshToken: string;

  @ApiProperty()
  @IsString()
  public role: Role;

  @ApiProperty()
  @IsBoolean()
  public isTwoFactorAuthEnabled: boolean;
}

export class AuthCreateDto {
  public user: UserEntity;
  public refreshToken: string;
  public accessToken: string;
}

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  public email: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  public refreshToken: string;
}
