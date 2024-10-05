import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const mockUserService = {
      list: jest.fn().mockResolvedValue([new UserEntity()]),
      getById: jest.fn(),
      updateRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should return an array of users', async () => {
    const result = await controller.list(0, true, 10, '');
    expect(result).toBeInstanceOf(Array);
    expect(service.list).toHaveBeenCalledWith(0, 10, true, '', false);
  });

  it('should return a user entity when found', async () => {
    const mockUser = new UserEntity();
    (service.getById as jest.Mock).mockResolvedValue(mockUser);

    const result = await controller.infoAdmin(1);
    expect(result).toEqual(mockUser);
    expect(service.getById).toHaveBeenCalledWith(1, true);
  });
  it('should return a user entity when found', async () => {
    const mockUser = new UserEntity();
    (service.getById as jest.Mock).mockResolvedValue(mockUser);

    const result = await controller.infoAdmin(1);
    expect(result).toEqual(mockUser);
    expect(service.getById).toHaveBeenCalledWith(1, true);
  });

  it('should throw a NotFoundException when user is not found', async () => {
    (service.getById as jest.Mock).mockRejectedValue(new NotFoundException());

    await expect(controller.infoAdmin(1)).rejects.toThrowError(
      NotFoundException,
    );
  });
});
