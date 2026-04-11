import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

import { JwtPayload } from '../common/types/jwtpayload.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { FetchUserRoleResponseDto } from './dto/fetch-user-role-response.dto.js';
import { SignInRequestDto } from './dto/sign-in-request.dto.js';
import { SignInResponseDto } from './dto/sign-in-response.dto.js';
import { SignUpRequestDto } from './dto/sign-up-request.dto.js';
import { SignUpResponseDto } from './dto/sign-up-response.dto.js';

// This service handles sign-in, sign-up, sign-out, and role fetching.
@Injectable()
export class AuthService {
  constructor(
    // This service is used to read and create user records.
    private readonly usersService: UsersService,

    // This service is used to generate JWT tokens.
    private readonly jwtService: JwtService,

    // This service is used to read values from the application config.
    private readonly configService: ConfigService,

    // This service is used to access the database directly.
    private readonly prisma: PrismaService,
  ) {}

  // This logger is used to save useful auth-related logs.
  private readonly logger = new Logger(AuthService.name);

  // This method signs in the user after checking credentials and account status.
  async signIn(signInReqDto: SignInRequestDto, req: Request): Promise<SignInResponseDto> {
    // This reads the login ID and removes extra spaces.
    const rawLoginId = signInReqDto.loginId.trim();

    // This reads the password entered by the user.
    const password = signInReqDto.password;

    // This converts the login ID to lowercase for email matching.
    const normalizedEmail = rawLoginId.toLowerCase();

    // This converts the login ID into a clean phone format for phone matching.
    const normalizedPhone = this.normalizePhone(rawLoginId);

    // This writes a log entry for the sign-in attempt.
    this.logger.log(`Attempting to sign in user: ${rawLoginId}`);

    // This tries to find the user by email or phone number.
    const user = await this.usersService.user({
      OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    // This handles the case where the user does not exist or has no password set.
    if (!user?.password_hash) {
      await this.createAuthAuditLog(
        null,
        rawLoginId,
        'SIGN_IN_FAILED',
        false,
        'USER_NOT_FOUND',
        req,
      );
      this.logger.error(`Failed sign in attempt. User not found: ${rawLoginId}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // This blocks sign-in if the user account is inactive.
    if (!user.is_active) {
      await this.createAuthAuditLog(
        user.user_id,
        rawLoginId,
        'SIGN_IN_FAILED',
        false,
        'USER_INACTIVE',
        req,
      );
      this.logger.error(`Failed sign in attempt. Inactive user: ${rawLoginId}`);
      throw new UnauthorizedException('User account is inactive.');
    }

    // This blocks sign-in if the user account is permanently blocked.
    if (user.is_blocked) {
      await this.createAuthAuditLog(
        user.user_id,
        rawLoginId,
        'SIGN_IN_FAILED',
        false,
        'USER_BLOCKED',
        req,
      );
      this.logger.error(`Failed sign in attempt. Blocked user: ${rawLoginId}`);
      throw new UnauthorizedException('Your account is blocked. Please contact admin.');
    }

    // This blocks sign-in if the account is still under temporary lock.
    if (user.locked_until && user.locked_until > new Date()) {
      await this.createAuthAuditLog(
        user.user_id,
        rawLoginId,
        'SIGN_IN_FAILED',
        false,
        'ACCOUNT_LOCKED',
        req,
      );
      this.logger.error(`Failed sign in attempt. Account temporarily locked: ${rawLoginId}`);
      throw new UnauthorizedException(
        'Your account is temporarily locked. Please try again later.',
      );
    }

    // This compares the entered password with the saved password hash.
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // This handles the case where the password is incorrect.
    if (!isMatch) {
      // This gets the current failed login count.
      const currentFailedAttempts = user.failed_login_attempts ?? 0;

      // This increases the failed login count by one.
      const nextFailedAttempts = currentFailedAttempts + 1;

      // This reads the allowed maximum failed attempts from config.
      const maxFailedAttempts = this.configService.get<number>('auth.maxFailedAttempts', 5);

      // This reads the temporary lock duration from config.
      const lockMinutes = this.configService.get<number>('auth.lockMinutes', 15);

      // This decides whether the account should now be blocked.
      const shouldBlockUser = nextFailedAttempts >= maxFailedAttempts;

      // This updates the failed attempts and lock information in the database.
      await this.prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          failed_login_attempts: nextFailedAttempts,
          is_blocked: shouldBlockUser,
          locked_until: shouldBlockUser ? new Date(Date.now() + lockMinutes * 60 * 1000) : null,
        },
      });

      // This saves an audit log for the failed password attempt.
      await this.createAuthAuditLog(
        user.user_id,
        rawLoginId,
        'SIGN_IN_FAILED',
        false,
        'INVALID_PASSWORD',
        req,
      );

      // This writes an error log for the failed sign-in.
      this.logger.error(`Failed sign in attempt. Invalid password for user: ${rawLoginId}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // This updates the user record after successful sign-in.
    await this.prisma.users.update({
      where: { user_id: user.user_id },
      data: {
        is_logged_in: true,
        last_login_at: new Date(),
        failed_login_attempts: 0,
        locked_until: null,
      },
    });

    // This creates the JWT access token for the signed-in user.
    const accessToken = await this.jwtService.signAsync<JwtPayload>({
      sub: user.user_id,
      email: user.email,
      role_id: user.role_id,
    });

    // This saves an audit log for the successful sign-in.
    await this.createAuthAuditLog(user.user_id, rawLoginId, 'SIGN_IN_SUCCESS', true, null, req);

    // This writes a success log for sign-in.
    this.logger.log(`User signed in successfully: ${rawLoginId}`);

    // This returns the access token to the client.
    return { accessToken };
  }

  // This method signs out the user and updates the login status.
  async signOut(userId: string, req: Request): Promise<{ message: string }> {
    // This gets the basic user details for logging and audit purposes.
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
      },
    });

    // This marks the user as logged out in the database.
    await this.prisma.users.update({
      where: { user_id: userId },
      data: {
        is_logged_in: false,
      },
    });

    // This saves an audit log for sign-out.
    await this.createAuthAuditLog(userId, user?.email ?? null, 'SIGN_OUT', true, null, req);

    // This writes a success log for sign-out.
    this.logger.log(`User signed out successfully: ${user?.email ?? userId}`);

    // This returns the sign-out success message.
    return { message: 'Signed out successfully.' };
  }

  // This method creates a new customer user account.
  async signUp(signUpReqDto: SignUpRequestDto): Promise<SignUpResponseDto> {
    // This reads and cleans the first name.
    const firstName = signUpReqDto.firstName.trim();

    // This reads and cleans the last name.
    const lastName = signUpReqDto.lastName.trim();

    // This reads and normalizes the email.
    const normalizedEmail = signUpReqDto.email.trim().toLowerCase();

    // This reads and normalizes the phone number.
    const normalizedPhone = this.normalizePhone(signUpReqDto.phone);

    // This reads the password entered by the user.
    const password = signUpReqDto.password;

    // This checks whether a user with the same email or phone already exists.
    const existingUser = await this.usersService.user({
      OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    // This stops sign-up if the user already exists.
    if (existingUser) {
      this.logger.error('Failed sign up attempt. User already exists');
      throw new UnauthorizedException('User with given email or phone already exists');
    }

    // This finds the default CUSTOMER role.
    const customerRole = await this.prisma.roles.findFirst({
      where: {
        role_code: 'CUSTOMER',
        is_active: true,
      },
      select: {
        role_id: true,
      },
    });

    // This throws an error if the default customer role is missing.
    if (!customerRole) {
      throw new NotFoundException('Default CUSTOMER role not found.');
    }

    // This gets the bcrypt salt round value from config.
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 10;

    // This hashes the password before saving it.
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // This creates the new user record in the database.
    const newUser = await this.usersService.createUser({
      user_id: randomUUID(),
      first_name: firstName,
      last_name: lastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password_hash: passwordHash,
      role_id: customerRole.role_id,
      is_logged_in: false,
      failed_login_attempts: 0,
      is_blocked: false,
      locked_until: null,
    });

    // This writes a success log for sign-up.
    this.logger.log(`User signed up successfully: ${normalizedEmail}`);

    // This returns the newly created user details.
    return {
      userId: newUser.user_id,
      email: newUser.email,
      phone: newUser.phone,
    };
  }

  // This method returns the role details of the logged-in user.
  async fetchUserRole(userId?: string, roleId?: string): Promise<FetchUserRoleResponseDto> {
    // This makes sure both user ID and role ID are present.
    if (!userId || !roleId) {
      throw new UnauthorizedException('Invalid token. User id or role id is missing.');
    }

    // This finds the active role using the role ID.
    const role = await this.prisma.roles.findFirst({
      where: {
        role_id: roleId,
        is_active: true,
      },
      select: {
        role_id: true,
        role_code: true,
      },
    });

    // This throws an error if the role is not found.
    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    // This returns the user role details.
    return {
      message: 'User role fetched successfully.',
      data: {
        userId,
        roleId: role.role_id,
        roleCode: role.role_code,
      },
    };
  }

  // This helper removes unwanted characters from the phone number.
  private normalizePhone(value: string): string {
    return value.trim().replace(/[^\d+]/g, '');
  }

  // This helper gets the client IP address from the request.
  private getClientIp(req: Request): string | null {
    // This first checks if the forwarded IP header is available.
    const forwardedFor = req.headers['x-forwarded-for'];

    // This returns the first forwarded IP if it exists.
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0]?.trim() ?? null;
    }

    // This falls back to the normal request IP.
    return req.ip ?? null;
  }

  // This helper gets the user agent from the request headers.
  private getUserAgent(req: Request): string | null {
    const userAgent = req.headers['user-agent'];
    return typeof userAgent === 'string' ? userAgent : null;
  }

  // This helper creates an authentication audit log record.
  private async createAuthAuditLog(
    userId: string | null,
    loginIdentifier: string | null,
    eventType: string,
    success: boolean,
    failureReason: string | null,
    req: Request,
  ): Promise<void> {
    // This saves the auth audit log in the database.
    await this.prisma.user_auth_audit_log.create({
      data: {
        user_id: userId,
        login_identifier: loginIdentifier,
        event_type: eventType,
        success,
        failure_reason: failureReason,
        ip_address: this.getClientIp(req),
        user_agent: this.getUserAgent(req),
      },
    });
  }
}
