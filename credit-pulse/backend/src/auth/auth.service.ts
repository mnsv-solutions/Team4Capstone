import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { JwtPayload } from '../types/jwtpayload.js';
import { UsersService } from '../users/users.service.js';
import { SignInRequestDto, SignInResponseDto } from './dto/signIn.dto.js';
import { SignUpRequestDto, SignUpResponseDto } from './dto/signup.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly logger = new Logger(AuthService.name);
  private readonly hashSaltRounds = 10;

  async signIn(signInReqDto: SignInRequestDto): Promise<SignInResponseDto> {
    this.logger.log(`Attempting to sign in user: ${signInReqDto.loginId}`);

    const user = await this.usersService.user({
      OR: [{ email: signInReqDto.loginId }, { phone: signInReqDto.loginId }],
    });

    if (!user?.password_hash) {
      this.logger.error(`Failed sign in attempt. User not found: ${signInReqDto.loginId}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(signInReqDto.password, user.password_hash);
    if (!isMatch) {
      this.logger.error(
        `Failed sign in attempt. Invalid password for user: ${signInReqDto.loginId}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync<JwtPayload>({
      sub: user.user_id,
      email: user.email,
      role_id: user.role_id,
    });

    this.logger.log(`User signed in successfully: ${signInReqDto.loginId}`);

    return { accessToken: accessToken };
  }

  async signUp(signUpReqDto: SignUpRequestDto): Promise<SignUpResponseDto> {
    const existingUser = await this.usersService.user({
      OR: [{ email: signUpReqDto.email }, { phone: signUpReqDto.phone }],
    });

    if (existingUser) {
      this.logger.error(`Failed sign up attempt. User already exists`);
      throw new UnauthorizedException('User with given email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(signUpReqDto.password, this.hashSaltRounds);

    const newUser = await this.usersService.createUser({
      user_id: randomUUID(),
      first_name: signUpReqDto.firstName,
      last_name: signUpReqDto.lastName,
      email: signUpReqDto.email,
      phone: signUpReqDto.phone,
      password_hash: passwordHash,
      role: {
        connect: { role_id: '2' }, //ToDo: connect to actual role based on user type
      },
    });

    this.logger.log(`User signed up successfully: ${signUpReqDto.email}`);

    return {
      userId: newUser.user_id,
      email: newUser.email,
      phone: newUser.phone,
    };
  }
}
