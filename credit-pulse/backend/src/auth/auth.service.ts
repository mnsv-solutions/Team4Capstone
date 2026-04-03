import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { JwtPayload } from '../common/types/jwtpayload.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { FetchUserRoleResponseDto } from './dto/fetch-user-role-response.dto.js';
import { SignInRequestDto, SignInResponseDto } from './dto/signIn.dto.js';
import { SignUpRequestDto, SignUpResponseDto } from './dto/signup.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

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
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
    const passwordHash = await bcrypt.hash(signUpReqDto.password, saltRounds);

    const newUser = await this.usersService.createUser({
      user_id: randomUUID(),
      first_name: signUpReqDto.firstName,
      last_name: signUpReqDto.lastName,
      email: signUpReqDto.email,
      phone: signUpReqDto.phone,
      password_hash: passwordHash,
      role_id: 'a0af170e-4862-499e-b259-40e313babf83', //ToDo: check the correct ID
    });

    this.logger.log(`User signed up successfully: ${signUpReqDto.email}`);

    return {
      userId: newUser.user_id,
      email: newUser.email,
      phone: newUser.phone,
    };
  }

  /**
   * Retrieves a user's role from the database.
   *
   * The function takes two parameters: userId and roleId. These parameters are required, and if either of them is missing,
   * the function throws an UnauthorizedException.
   *
   * The function first checks if the roleId exists in the database. It checks if the role is active by querying the database
   * for a role that matches the roleId and has is_active set to true.
   *
   * If the role does not exist, the function throws a NotFoundException.
   *
   * Finally, the function returns a FetchUserRoleResponseDto object containing the user's role data. The object contains a success message,
   * and a data object with the user's ID, the role's ID, and the role's code.
   *
   * @param {string} userId - The user ID. This parameter is required.
   * @param {string} roleId - The role ID. This parameter is required.
   * @return {Promise<FetchUserRoleResponseDto>} - A promise that resolves to a FetchUserRoleResponseDto object
   */
  async fetchUserRole(userId?: string, roleId?: string): Promise<FetchUserRoleResponseDto> {
    // Check that both userId and roleId are present
    if (!userId || !roleId) {
      // If either of them is missing, throw an UnauthorizedException
      throw new UnauthorizedException('Invalid token. User id or role id is missing.');
    }

    // Check if the role exists in the database
    const role = await this.prisma.roles.findFirst({
      // Query the database for a role that matches the roleId and has is_active set to true
      where: {
        role_id: roleId,
        is_active: true,
      },
      // Select only the role_id and role_code from the database
      select: {
        role_id: true,
        role_code: true,
      },
    });

    // If the role does not exist, throw a NotFoundException
    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    // Return a FetchUserRoleResponseDto object containing the user's role data
    return {
      // Success message
      message: 'User role fetched successfully.',
      // Data object with the user's ID, the role's ID, and the role's code
      data: {
        userId,
        roleId: role.role_id,
        roleCode: role.role_code,
      },
    };
  }
}
