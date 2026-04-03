import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { FetchUserRoleResponseDto } from './dto/fetch-user-role-response.dto.js';
import { SignInRequestDto, SignInResponseDto } from './dto/signIn.dto.js';
import { SignUpRequestDto, SignUpResponseDto } from './dto/signup.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInReqDto: SignInRequestDto): Promise<SignInResponseDto> {
    return await this.authService.signIn(signInReqDto);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpReqDto: SignUpRequestDto): Promise<SignUpResponseDto> {
    return await this.authService.signUp(signUpReqDto);
  }

  @UseGuards(AuthGuard)
  @Get('fetch-user-role')
  /**
   * This function fetches a user's role from the database.
   *
   * The function takes a request object as a parameter, which contains the user object.
   * The user object can contain three properties: sub, userId, and role_id.
   *
   * The function first checks if the user object contains a sub property, and if it does,
   * it uses the sub property as the user ID. If the user object does not contain a sub property,
   * it checks if the user object contains a userId property, and if it does, it uses the userId
   * property as the user ID. If the user object does not contain a userId property, it throws an
   * error.
   *
   * The function then calls the fetchUserRole function in the AuthService, passing the user ID and role ID
   * as parameters. The fetchUserRole function in the AuthService fetches the user's role from the database,
   * and returns a FetchUserRoleResponseDto object containing the user's role data.
   *
   * @param {Request} req - The request object containing the user object.
   * @return {Promise<FetchUserRoleResponseDto>} - A promise that resolves to a FetchUserRoleResponseDto object.
   */
  async fetchUserRole(
    @Req() req: { user: { sub?: string; userId?: string; role_id?: string } },
  ): Promise<FetchUserRoleResponseDto> {
    const userId = req.user?.sub ?? req.user?.userId;
    const roleId = req.user?.role_id;

    // Check if the user ID is valid
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    // Check if the role ID is valid
    return await this.authService.fetchUserRole(userId, roleId);
  }
}
