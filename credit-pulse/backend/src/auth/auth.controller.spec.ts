import { jest } from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SignInRequestDto, SignInResponseDto } from './dto/signIn.dto.js';
import { SignUpRequestDto, SignUpResponseDto } from './dto/signup.dto.js';

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
      providers: [{ provide: AuthService, useValue: authService }],
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

      authService.signIn.mockResolvedValue(expectedResponse);

      await expect(controller.signIn(requestDto)).resolves.toEqual(expectedResponse);
      expect(authService.signIn).toHaveBeenCalledWith(requestDto);
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
