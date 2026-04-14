import { jest } from '@jest/globals';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { SignInRequestDto } from './dto/sign-in-request.dto.js';
import { SignInResponseDto } from './dto/sign-in-response.dto.js';
import { SignUpRequestDto } from './dto/sign-up-request.dto.js';
import { SignUpResponseDto } from './dto/sign-up-response.dto.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { signIn: jest.Mock; signUp: jest.Mock };

  beforeEach(async () => {
    authService = {
      signIn: jest.fn(),
      signUp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should delegate to authService.signIn and return response', async () => {
      const requestDto: SignInRequestDto = {
        loginId: 'test@example.com',
        password: 'password123',
      };
      const expectedResponse: SignInResponseDto = { accessToken: 'jwt-token' };
      const request = { headers: {}, ip: '127.0.0.1' };

      authService.signIn.mockResolvedValue(expectedResponse);

      await expect(controller.signIn(requestDto, request as never)).resolves.toEqual(
        expectedResponse,
      );
      expect(authService.signIn).toHaveBeenCalledWith(requestDto, request);
      expect(authService.signIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('signUp', () => {
    it('should delegate to authService.signUp and return response', async () => {
      const requestDto: SignUpRequestDto = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '1234567890',
        password: 'password123',
      };
      const expectedResponse: SignUpResponseDto = {
        userId: 'user-123',
        email: 'jane@example.com',
        phone: '1234567890',
      };

      authService.signUp.mockResolvedValue(expectedResponse);

      await expect(controller.signUp(requestDto)).resolves.toEqual(expectedResponse);
      expect(authService.signUp).toHaveBeenCalledWith(requestDto);
      expect(authService.signUp).toHaveBeenCalledTimes(1);
    });
  });
});
