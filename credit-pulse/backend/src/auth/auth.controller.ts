import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { FetchUserRoleResponseDto } from './dto/fetch-user-role-response.dto.js';
import { SignInRequestDto } from './dto/sign-in-request.dto.js';
import { SignInResponseDto } from './dto/sign-in-response.dto.js';
import { SignUpRequestDto } from './dto/sign-up-request.dto.js';
import { SignUpResponseDto } from './dto/sign-up-response.dto.js';

// This type is used for requests that include user details from the JWT token.
type JwtRequest = Request & {
  user?: {
    // This stores the user ID from the token.
    sub?: string;

    // This is another possible user ID field from the token.
    userId?: string;

    // This stores the role ID from the token.
    role_id?: string;
  };
};

// This controller handles sign-in, sign-up, sign-out, and user role related APIs.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // This API signs in the user and returns the access token.
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInReqDto: SignInRequestDto,
    @Req() req: Request,
  ): Promise<SignInResponseDto> {
    // This sends the sign-in request to the service layer.
    return await this.authService.signIn(signInReqDto, req);
  }

  // This API creates a new user account.
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpReqDto: SignUpRequestDto): Promise<SignUpResponseDto> {
    // This sends the sign-up request to the service layer.
    return await this.authService.signUp(signUpReqDto);
  }

  // This API signs out the logged-in user.
  @UseGuards(AuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signOut(@Req() req: JwtRequest): Promise<{ message: string }> {
    // This gets the user ID from the token.
    const userId = req.user?.sub ?? req.user?.userId;

    // This checks whether the user ID exists in the token.
    if (!userId) {
      throw new UnauthorizedException('Invalid token. User id is missing.');
    }

    // This sends the sign-out request to the service layer.
    return await this.authService.signOut(userId, req);
  }

  // This API returns the role details of the logged-in user.
  @UseGuards(AuthGuard)
  @Get('fetch-user-role')
  async fetchUserRole(@Req() req: JwtRequest): Promise<FetchUserRoleResponseDto> {
    // This gets the user ID from the token.
    const userId = req.user?.sub ?? req.user?.userId;

    // This gets the role ID from the token.
    const roleId = req.user?.role_id;

    // This checks whether the user ID exists in the token.
    if (!userId) {
      throw new UnauthorizedException('Invalid token. User id is missing.');
    }

    // This sends the user details to the service layer to fetch the role.
    return await this.authService.fetchUserRole(userId, roleId);
  }
}
