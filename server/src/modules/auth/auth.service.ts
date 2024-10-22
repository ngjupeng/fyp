import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenType } from '../../common/enums/token';
import { UserSignUpDto } from '../user/user.dto';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { TokenRepository } from './token.repository';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { toFileStream } from 'qrcode';
import {
  VerifyEmailDto,
  ForgotPasswordDto,
  RestorePasswordDto,
  SignInDto,
  AuthDto,
  ResendVerificationDto,
} from './auth.dto';
import { MailService } from '../mail/mail.service';
import { MAIL_TEMPLATES, APP } from '../../common/constants';
import {
  ErrorUser,
  ErrorAuth,
  ErrorToken,
} from '../../common/constants/errors';
import { UserStatus } from '../../common/enums/user';
import { createHash } from 'crypto';
import { AppConfigService } from '../../common/config/services/config.service';
import { MailType } from '../../common/enums/mail';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenExpiresIn: number;
  private readonly accessTokenExpiresIn: number;
  private readonly salt: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.refreshTokenExpiresIn = parseInt(
      this.appConfigService.authConfig.jwt.refreshTokenExpiresIn,
    );
    this.accessTokenExpiresIn = parseInt(
      this.appConfigService.authConfig.jwt.accessTokenExpiresIn,
    );
    this.frontendUrl = this.appConfigService.otherConfig.frontendUrl;
  }

  public async signin(data: SignInDto): Promise<AuthDto> {
    const userEntity = await this.userService.getByCredentials(
      data.email,
      data.password,
    );

    if (!userEntity) {
      throw new NotFoundException(ErrorAuth.InvalidCredentials);
    }

    if (userEntity.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(ErrorAuth.UserNotActive);
    }

    return this.auth(userEntity, userEntity.isTwoFactorAuthEnabled);
  }

  public async verifyTwoFaCode(
    code: string,
    user: UserEntity,
  ): Promise<boolean> {
    const userEntity = await this.userService.getByEmail(user.email);
    return authenticator.verify({
      token: code,
      secret: userEntity.twoFactorAuthSecret,
    });
  }

  public async activateTwoFactorAuth(user: UserEntity): Promise<UserEntity> {
    return this.userService.changeTwoFactorAuth(user, true);
  }

  public async deactivateTwoFactorAuth(user: UserEntity): Promise<UserEntity> {
    // clear the two factor auth secret
    user.twoFactorAuthSecret = null;
    return this.userService.changeTwoFactorAuth(user, false);
  }

  public async authenticateTwoFactor(
    user: UserEntity,
    code: string,
  ): Promise<AuthDto> {
    const isTwoFaAuthenticated = await this.verifyTwoFaCode(code, user);
    if (isTwoFaAuthenticated) {
      await this.activateTwoFactorAuth(user);
      // send email to notify user that 2fa is enabled
      await this.sendEmailWithMailType(
        user,
        TokenType.EMAIL,
        MailType.ENABLED_2FA,
      );
      return this.auth(user, true);
    }
    throw new UnauthorizedException(ErrorAuth.InvalidTwoFactorCode);
  }

  public async auth(
    userEntity: UserEntity,
    isTwoFaAuthenticated: boolean,
  ): Promise<AuthDto> {
    const authEntity = this.authRepository.findOne({ userId: userEntity.id });

    const accessToken = await this.jwtService.signAsync(
      {
        email: userEntity.email,
        userId: userEntity.id,
        isTwoFaAuthenticated,
      },
      {
        expiresIn: this.accessTokenExpiresIn,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        email: userEntity.email,
        userId: userEntity.id,
        isTwoFaAuthenticated,
      },
      {
        expiresIn: this.refreshTokenExpiresIn,
      },
    );

    const accessTokenHashed = this.hashToken(accessToken);
    const refreshTokenHashed = this.hashToken(refreshToken);

    if (authEntity) {
      await this.logout(userEntity);
    }

    await this.authRepository.create({
      user: userEntity,
      refreshToken: refreshTokenHashed,
      accessToken: accessTokenHashed,
    });

    return {
      accessToken,
      refreshToken,
      role: userEntity.role,
      isTwoFactorAuthEnabled: userEntity.isTwoFactorAuthEnabled,
    };
  }

  public async refreshToken(refreshToken: string): Promise<AuthDto> {
    const refreshTokenHashed = this.hashToken(refreshToken);

    const authEntity = await this.authRepository.findOne(
      { refreshToken: refreshTokenHashed },
      { relations: ['user'] },
    );

    if (!authEntity) {
      throw new UnauthorizedException(ErrorAuth.InvalidRefreshToken);
    }

    // Verify the refresh token
    const { userId, email, isTwoFaAuthenticated } =
      await this.jwtService.verifyAsync(refreshToken);

    // Generate a new access token
    const newAccessToken = await this.jwtService.signAsync(
      {
        email,
        userId,
        isTwoFaAuthenticated,
      },
      {
        expiresIn: this.accessTokenExpiresIn,
      },
    );

    // Generate a new refresh token
    const newRefreshToken = await this.jwtService.signAsync(
      {
        email,
        userId,
        isTwoFaAuthenticated,
      },
      {
        expiresIn: this.refreshTokenExpiresIn,
      },
    );

    // Hash the new tokens
    const newAccessTokenHashed = this.hashToken(newAccessToken);
    const newRefreshTokenHashed = this.hashToken(newRefreshToken);

    // Update the auth entity with the new tokens
    authEntity.accessToken = newAccessTokenHashed;
    authEntity.refreshToken = newRefreshTokenHashed;
    await authEntity.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      role: authEntity.user.role,
      isTwoFactorAuthEnabled: authEntity.user.isTwoFactorAuthEnabled,
    };
  }

  public async logout(user: UserEntity): Promise<void> {
    await this.authRepository.delete({ userId: user.id });
  }

  public hashToken(token: string): string {
    const hash = createHash('sha256');
    hash.update(token + this.salt);
    return hash.digest('hex');
  }

  public async signupSandbox(data: UserSignUpDto): Promise<UserEntity> {
    // check if sandbox is enabled
    if (!this.appConfigService.otherConfig.allowsSandbox) {
      throw new BadRequestException(ErrorAuth.SandboxDisabled);
    }
    let existingUser = await this.userService.getByEmail(data.email);
    if (existingUser) {
      if (existingUser.status == UserStatus.ACTIVE) {
        throw new BadRequestException(ErrorUser.EmailExists);
      } else if (existingUser.status == UserStatus.PENDING) {
        {
          // activate user
          existingUser = await this.userService.activate(existingUser);
          // then, if there's any email verification token, remove it
          const tokenEntity = await this.tokenRepository.findOne({
            userId: existingUser.id,
            tokenType: TokenType.EMAIL,
          });
          if (tokenEntity) {
            await tokenEntity.remove();
          }
          return existingUser;
        }
      }
    }
    const userEntity = await this.userService.create(
      {
        ...data,
        confirm: data.password,
      },
      true,
    );
    return userEntity;
  }

  public async signup(data: UserSignUpDto): Promise<UserEntity> {
    // search for existing user
    let existingUser = await this.userService.getByEmail(data.email);
    console.log(existingUser);

    if (existingUser) {
      // if status is active, then user already exists
      if (existingUser.status == UserStatus.ACTIVE) {
        throw new BadRequestException(ErrorUser.EmailExists);
      }

      // if status is pending, update user and resend verification email
      if (existingUser.status == UserStatus.PENDING) {
        existingUser = await this.userService.update(data);
        await this.sendEmailWithMailType(
          existingUser,
          TokenType.EMAIL,
          MailType.VERIFICATION,
        );

        return existingUser;
      }
    } else {
      // check if signup with referral code is enabled
      // create a new user and send verification email
      const newUser = await this.userService.create(data);
      await this.sendEmailWithMailType(
        newUser,
        TokenType.EMAIL,
        MailType.VERIFICATION,
      );

      return newUser;
    }
  }

  public async generateTwoFactorAuthSecret(user: UserEntity) {
    const userEntity = await this.userService.getByEmail(user.email);
    if (userEntity) {
      if (userEntity.isTwoFactorAuthEnabled) {
        throw new BadRequestException(ErrorAuth.TwoFactorAuthAlreadyEnabled);
      }
    }

    const secret = authenticator.generateSecret();
    const app_name = APP;
    const otpAuthUrl = authenticator.keyuri(user.email, app_name, secret);

    await this.userService.updateTwoFactorAuthSecret(user, secret);
    return {
      secret,
      otpAuthUrl,
    };
  }

  public async qrCodeStreamPipe(stream: Response, otpPathUrl: string) {
    return toFileStream(stream, otpPathUrl);
  }

  public async emailVerification(data: VerifyEmailDto): Promise<void> {
    this.verifyUUIDToken(data.token);

    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.EMAIL,
    });

    if (!tokenEntity) {
      throw new NotFoundException(ErrorToken.NotFound);
    }
    // if user is already active
    if (tokenEntity.user.status == UserStatus.ACTIVE) {
      throw new BadRequestException(ErrorUser.UserAlreadyActive);
    }
    this.userService.activate(tokenEntity.user);
    await tokenEntity.remove();
  }

  public async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const userEntity = await this.userService.getByEmail(data.email);

    if (!userEntity) {
      throw new NotFoundException(ErrorUser.NotFound);
    }

    if (userEntity.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException(ErrorAuth.UserNotActive);

    await this.sendEmailWithMailType(
      userEntity,
      TokenType.PASSWORD,
      MailType.RESET_PASSWORD,
    );
  }

  public async restorePassword(data: RestorePasswordDto): Promise<boolean> {
    // check if data.token is uuid format
    this.verifyUUIDToken(data.token);

    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.PASSWORD,
    });

    if (!tokenEntity) {
      throw new NotFoundException(ErrorToken.NotFound);
    }

    this.userService.updatePassword(tokenEntity.user, data.password);

    // TODO - might consider sending an email to confirm the password change
    await tokenEntity.remove();

    return true;
  }

  public async resendVerificationEmail(
    data: ResendVerificationDto,
  ): Promise<void> {
    const userEntity = await this.userService.getByEmail(data.email);
    if (!userEntity) {
      throw new BadRequestException(ErrorUser.NotFound);
    }

    // if user is already active, then do not send verification email
    if (userEntity.status == UserStatus.ACTIVE) {
      throw new BadRequestException(ErrorUser.UserAlreadyActive);
    }

    await this.sendEmailWithMailType(
      userEntity,
      TokenType.EMAIL,
      MailType.VERIFICATION,
    );
  }

  public async sendEmailWithMailType(
    user: UserEntity,
    tokenType: TokenType,
    mailType: MailType,
  ): Promise<void> {
    if (mailType == MailType.ENABLED_2FA) {
      // send email to notify user that 2fa is enabled
      const filledTemplate = MAIL_TEMPLATES.enabled2fa();
      this.mailService.sendEmail({
        to: user.email,
        ...filledTemplate,
      });
      return;
    }
    // find existing token
    const existingToken = await this.tokenRepository.findOne({
      userId: user.id,
      tokenType: tokenType,
    });
    // if token exists, remove it
    if (existingToken) {
      // check if token last_resend_at + resend interval is greater than current time
      const resendInterval = this.appConfigService.mailConfig.resendInterval;
      if (
        Number(existingToken.createdAt.getTime()) +
          Number(resendInterval) * 1000 >
        new Date().getTime()
      ) {
        throw new BadRequestException(ErrorAuth.ResendInterval);
      }
      await existingToken.remove();
    }

    const tokenEntity = await this.tokenRepository.create({
      tokenType: tokenType,
      user,
    });

    const verificationUrl = this.frontendUrl
      ? `${this.frontendUrl}/verify-email?token=${tokenEntity.uuid}`
      : `${this.appConfigService.serverConfig.serverUrl}/auth/email-verification?token=${tokenEntity.uuid}`;

    const resetPasswordUrl = `${this.frontendUrl}/reset-password?token=${tokenEntity.uuid}`;

    const filledTemplate =
      mailType === MailType.VERIFICATION
        ? MAIL_TEMPLATES.verification(verificationUrl)
        : MAIL_TEMPLATES.resetPassword(resetPasswordUrl);

    this.mailService.sendEmail({
      to: user.email,
      ...filledTemplate,
    });
  }

  public compareToken(token: string, hashedToken: string): boolean {
    return this.hashToken(token) === hashedToken;
  }

  public verifyUUIDToken(token: string) {
    // check if data.token is uuid format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      throw new BadRequestException(ErrorToken.InvalidFormat);
    }
  }
}
