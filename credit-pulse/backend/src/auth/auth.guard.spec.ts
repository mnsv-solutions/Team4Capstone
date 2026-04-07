import { jest } from '@jest/globals';

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthGuard } from './auth.guard.js';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: jest.Mock<any> };
  let configService: { get: jest.Mock<any> };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('secret'),
    };

    guard = new AuthGuard(jwtService as unknown as JwtService, configService as any);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException when token is missing', async () => {
    const request = { headers: {} };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      new UnauthorizedException('No token provided'),
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when token is invalid', async () => {
    const request = { headers: { authorization: 'Bearer invalid-token' } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      new UnauthorizedException('Invalid token'),
    );
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', { secret: 'secret' });
  });

  it('should attach payload to request and return true for valid token', async () => {
    const request: { headers: { authorization: string }; user?: unknown } = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
    const payload = { sub: 'user-1', email: 'test@example.com', role_id: '2' };

    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', { secret: 'secret' });
    expect(request.user).toEqual(payload);
  });

  it('should reject non-bearer authorization header', async () => {
    const request = { headers: { authorization: 'Basic token' } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      new UnauthorizedException('No token provided'),
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });
});
