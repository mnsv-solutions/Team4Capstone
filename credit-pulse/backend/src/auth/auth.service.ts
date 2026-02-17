import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async signIn(username: string, password: string): Promise<any> {
    this.logger.log(`Attempting to sign in user: ${username}`);
    const user = this.usersService.findOne(username);

    if (user?.password_hash !== password) {
      this.logger.error(`Failed sign in attempt for user: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const jwtPayload = { sub: user.user_id, email: user.email, role_id: user.role_id };
    const accessToken = await this.jwtService.signAsync(jwtPayload);
    this.logger.log(`User signed in successfully: ${username}`);

    return { access_token: accessToken };
  }
}
