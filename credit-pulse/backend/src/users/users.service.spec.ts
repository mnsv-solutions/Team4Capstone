import { jest } from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    user: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('user should call prisma.user.findFirst with where input', async () => {
    const whereInput = { email: 'user@example.com' };
    const expectedUser = { user_id: 'u1', email: 'user@example.com' };

    prismaService.user.findFirst.mockResolvedValue(expectedUser);

    await expect(service.user(whereInput as never)).resolves.toEqual(expectedUser);
    expect(prismaService.user.findFirst).toHaveBeenCalledWith({ where: whereInput });
  });

  it('users should call prisma.user.findMany with params', async () => {
    const params = {
      skip: 0,
      take: 10,
      where: { role_id: '2' },
      orderBy: { created_at: 'desc' },
    };
    const expectedUsers = [{ user_id: 'u1' }, { user_id: 'u2' }];

    prismaService.user.findMany.mockResolvedValue(expectedUsers);

    await expect(service.users(params as never)).resolves.toEqual(expectedUsers);
    expect(prismaService.user.findMany).toHaveBeenCalledWith(params);
  });

  it('createUser should call prisma.user.create with data', async () => {
    const data = {
      user_id: 'u3',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      password_hash: 'hash',
      role: { connect: { role_id: '2' } },
    };
    const expectedCreatedUser = { user_id: 'u3', email: 'jane@example.com' };

    prismaService.user.create.mockResolvedValue(expectedCreatedUser);

    await expect(service.createUser(data as never)).resolves.toEqual(expectedCreatedUser);
    expect(prismaService.user.create).toHaveBeenCalledWith({ data });
  });

  it('updateUser should call prisma.user.update with where and data', async () => {
    const params = {
      where: { user_id: 'u1' },
      data: { first_name: 'Updated' },
    };
    const expectedUpdatedUser = { user_id: 'u1', first_name: 'Updated' };

    prismaService.user.update.mockResolvedValue(expectedUpdatedUser);

    await expect(service.updateUser(params as never)).resolves.toEqual(expectedUpdatedUser);
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: params.where,
      data: params.data,
    });
  });

  it('deleteUser should call prisma.user.delete with where', async () => {
    const where = { user_id: 'u1' };
    const expectedDeletedUser = { user_id: 'u1' };

    prismaService.user.delete.mockResolvedValue(expectedDeletedUser);

    await expect(service.deleteUser(where as never)).resolves.toEqual(expectedDeletedUser);
    expect(prismaService.user.delete).toHaveBeenCalledWith({ where });
  });
});
