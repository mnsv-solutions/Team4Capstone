import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '../auth.service';
import { LoginController } from './login.controller';

describe('LoginController', () => {
  let controller: LoginController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [AuthService],
    }).compile();

    controller = module.get<LoginController>(LoginController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return success message on valid login', () => {
    const loginDto = { username: 'admin', password: 'password' };
    const result = controller.login(loginDto);
    expect(result).toEqual({ success: true, message: 'Login successful' });
  });

  it('should throw ForbiddenException on invalid login', () => {
    const loginDto = { username: 'user', password: 'wrongpassword' };
    try {
      controller.login(loginDto);
    } catch (error) {
      expect(error.status).toBe(403);
      expect(error.response).toEqual({
        success: false,
        message: 'Invalid username or password',
      });
    }
  });
});
