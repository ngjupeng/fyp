import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseInterceptors,
  HttpCode,
  UseGuards,
  Req,
  Res,
  Header,
  Get,
  UsePipes,
  Query,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { UserSignUpDto, UserSignUpSandboxDto } from '../user/user.dto';
import {
  SignInDto,
  AuthDto,
  ResendVerificationDto,
  TwoFaAuthDto,
  RefreshTokenDto,
} from './auth.dto';
import { JwtAuthGuard } from '../../common/guards';
import { AuthService } from './auth.service';
import {
  VerifyEmailDto,
  ForgotPasswordDto,
  RestorePasswordDto,
} from './auth.dto';
import { RequestWithUser } from '../../common/interfaces';
import { SandboxCheckPipe } from '../../common/pipes/sandbox';
import { ReferralCodeGuard } from '../../common/guards/referral.enable';

@ApiTags('Auth')
@Controller('/auth')
export class AuthJwtController {
  constructor(private readonly authService: AuthService) {}

  // @notice In sandbox mode, the user is automatically activated
  @Public()
  @Post('/signup-sandbox')
  @UseInterceptors(ClassSerializerInterceptor)
  @UsePipes(SandboxCheckPipe)
  @ApiOperation({
    summary: 'Sandbox Signup',
    description:
      'Quickly sign up a user without email verification. Only callable in sandbox mode',
  })
  @ApiResponse({
    status: 201,
    description: 'Created sandbox user successfully',
  })
  public async signupSandbox(@Body() dto: UserSignUpSandboxDto): Promise<void> {
    await this.authService.signupSandbox(dto);
  }

  @Public()
  @Post('/signup')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ReferralCodeGuard)
  @ApiOperation({
    summary: 'Create User Account',
    description: 'Sign up a new user with email verification',
  })
  @ApiResponse({
    status: 201,
    description: 'Created user successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Email existed',
  })
  public async signup(@Body() dto: UserSignUpDto): Promise<void> {
    await this.authService.signup(dto);
  }

  @Public()
  @Post('/signin')
  @HttpCode(200)
  @ApiOperation({
    summary: 'User Sign In',
    description: 'Authenticate a user and generate an access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Sign in successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'User not active',
  })
  @ApiResponse({
    status: 404,
    description: 'No such user found',
  })
  public signin(@Body() dto: SignInDto): Promise<AuthDto> {
    return this.authService.signin(dto);
  }

  @Post('/refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh Token',
    description: 'Refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Refresh token successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  public refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthDto> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Public()
  @Post('/forgot-password')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Forgot Password',
    description: 'Endpoint to initiate the password reset process',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 204,
    description: 'Password reset email sent successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content',
  })
  public forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('/email-verification')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Email Verification',
    description:
      'Endpoint to verify the user email address using a POST request',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verification successful',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content',
  })
  public async emailVerification(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.authService.emailVerification(dto);
  }

  @Public()
  @Get('/email-verification')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Email Verification',
    description:
      'Endpoint to verify the user email address using a GET request',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: "Verification token sent to the user's email",
  })
  @ApiResponse({
    status: 200,
    description: 'Email verification successful',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content',
  })
  public async emailVerificationWithToken(
    @Query('token') token: string,
  ): Promise<void> {
    await this.authService.emailVerification({ token });
  }

  @Public()
  @Post('/restore-password')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Restore Password',
    description: 'Endpoint to restore the user password after reset',
  })
  @ApiBody({ type: RestorePasswordDto })
  @ApiResponse({
    status: 204,
    description: 'Password restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content',
  })
  public restorePassword(@Body() dto: RestorePasswordDto): Promise<boolean> {
    return this.authService.restorePassword(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'User Logout',
    description: 'Endpoint to log out the user',
  })
  @ApiResponse({
    status: 204,
    description: 'User logged out successfully',
  })
  public async logout(@Req() request: RequestWithUser): Promise<void> {
    await this.authService.logout(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/gen-qr-code')
  @HttpCode(200)
  @ApiOperation({
    summary: '2fa qr generation',
    description: 'generates qr code for 2fa',
  })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
  })
  @Header('content-type', 'image/png')
  public async generateQrCode(
    @Req() request: RequestWithUser,
    @Res() response: Response,
  ): Promise<void> {
    const { otpAuthUrl } = await this.authService.generateTwoFactorAuthSecret(
      request.user,
    );
    return await this.authService.qrCodeStreamPipe(response, otpAuthUrl);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('turn-off-2fa')
  @ApiOperation({
    summary: 'Disable 2FA',
    description: 'Disable 2fa for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: '2fa disabled successfully',
  })
  async deactivationOfTwoFa(@Req() request: RequestWithUser): Promise<void> {
    await this.authService.deactivateTwoFactorAuth(request.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('authenticate-2fa')
  @ApiOperation({
    summary: 'Authenticate 2FA Code',
    description:
      'Verifies the provided 2FA code and completes the 2FA authentication process if the code is valid',
  })
  @ApiResponse({
    status: 201,
    description: 'Authenticated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid code',
  })
  async authenticationOfTwoFa(
    @Req() request: RequestWithUser,
    @Body() dto: TwoFaAuthDto,
  ): Promise<AuthDto> {
    return await this.authService.authenticateTwoFactor(request.user, dto.code);
  }

  @Public()
  @Post('/resend-verification')
  @ApiBody({ type: ResendVerificationDto })
  @ApiOperation({
    summary: 'Resend Email Verification',
    description:
      'Resend the verification email to the user for email address confirmation',
  })
  @ApiResponse({
    status: 204,
    description: 'Verification email resent successfully',
  })
  public async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<void> {
    await this.authService.resendVerificationEmail(dto);
  }
}
