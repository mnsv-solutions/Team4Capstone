import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service.js';
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
}
