import { AuthJwtController } from '../auth/auth.controller';
import { UserSignUpDto } from '../user/user.dto';

describe('AuthJwtController', () => {
  let authJwtController;
  let authServiceMock;

  beforeEach(() => {
    authServiceMock = {
      signupSandbox: jest.fn(),
      signup: jest.fn().mockResolvedValue(undefined),
      signin: jest.fn(),
      forgotPassword: jest.fn(),
      restorePassword: jest.fn(),
      verifyEmail: jest.fn().mockReturnValue({}),
      logout: jest.fn(),
      resendVerificationEmail: jest.fn(),
    };

    authJwtController = new AuthJwtController(authServiceMock);
  });

  it('should call AuthService.signup with the provided dto', async () => {
    const dto = new UserSignUpDto();
    await authJwtController.signupSandbox(dto);

    expect(authServiceMock.signupSandbox).toHaveBeenCalledWith(dto);
  });
  it('should call AuthService.signin with the provided dto', async () => {
    const dto = new UserSignUpDto();
    await authJwtController.signin(dto);

    expect(authServiceMock.signin).toHaveBeenCalledWith(dto);
  });
  it('should call AuthService.forgotPassword with the provided dto', async () => {
    const dto = new UserSignUpDto();
    await authJwtController.forgotPassword(dto);

    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('should call AuthService.restorePassword with the provided dto', async () => {
    const dto = new UserSignUpDto();
    await authJwtController.restorePassword(dto);

    expect(authServiceMock.restorePassword).toHaveBeenCalledWith(dto);
  });

  it('should call AuthService.logout with the provided dto', async () => {
    const dto = new UserSignUpDto();
    await authJwtController.logout(dto);

    expect(authServiceMock.logout).toHaveBeenCalledWith(undefined);
  });
});
