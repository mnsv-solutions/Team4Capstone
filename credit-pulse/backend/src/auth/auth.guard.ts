import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Request } from 'express';

import { JwtPayload } from '../common/types/jwtpayload.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      req.user = payload;
    } catch (error) {
      this.logger.error(`JWT verification error: ${error}`);
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(req: Request): string | null {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : null;
  }
}
