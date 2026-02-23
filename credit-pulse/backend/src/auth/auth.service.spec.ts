import { jest } from '@jest/globals';

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { SignInRequestDto } from './dto/signIn.dto.js';
import { SignUpRequestDto } from './dto/signup.dto.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { user: jest.Mock; createUser: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersService = {
      user: jest.fn(),
      createUser: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    const configService = new ConfigService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    configService.get = jest.fn().mockReturnValue(10);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    const signInRequest: SignInRequestDto = {
      loginId: 'user@example.com',
      password: 'password123',
    };

    it('should throw unauthorized when user does not exist', async () => {
      usersService.user.mockResolvedValue(null);

      await expect(service.signIn(signInRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(usersService.user).toHaveBeenCalledWith({
        OR: [{ email: signInRequest.loginId }, { phone: signInRequest.loginId }],
      });
    });

    it('should throw unauthorized when password does not match', async () => {
      const passwordHash = await bcrypt.hash('different-password', 1);
      usersService.user.mockResolvedValue({
        user_id: 'user-1',
        email: 'user@example.com',
        role_id: '2',
        password_hash: passwordHash,
      });

      await expect(service.signIn(signInRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should return access token when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash(signInRequest.password, 1);
      usersService.user.mockResolvedValue({
        user_id: 'user-1',
        email: 'user@example.com',
        role_id: '2',
        password_hash: passwordHash,
      });
      jwtService.signAsync.mockResolvedValue('access-token');

      await expect(service.signIn(signInRequest)).resolves.toEqual({
        accessToken: 'access-token',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'user@example.com',
        role_id: '2',
      });
    });
  });

  describe('signUp', () => {
    const signUpRequest: SignUpRequestDto = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '1234567890',
      password: 'password123',
    };

    it('should throw unauthorized when user already exists', async () => {
      usersService.user.mockResolvedValue({ user_id: 'existing-user' });

      await expect(service.signUp(signUpRequest)).rejects.toThrow(
        new UnauthorizedException('User with given email or phone already exists'),
      );
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('should create user and return response when user does not exist', async () => {
      usersService.user.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue({
        user_id: 'new-user-id',
        email: 'jane@example.com',
        phone: '1234567890',
      });

      await expect(service.signUp(signUpRequest)).resolves.toEqual({
        userId: 'new-user-id',
        email: 'jane@example.com',
        phone: '1234567890',
      });

      expect(usersService.createUser).toHaveBeenCalledWith({
        user_id: expect.any(String),
        first_name: signUpRequest.firstName,
        last_name: signUpRequest.lastName,
        email: signUpRequest.email,
        phone: signUpRequest.phone,
        password_hash: expect.any(String),
        role: {
          connect: { role_id: '2' },
        },
      });
    });
  });
});
