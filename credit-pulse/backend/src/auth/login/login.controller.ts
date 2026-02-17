import { Body, Controller, ForbiddenException, HttpCode, Post } from '@nestjs/common';

import { AuthService } from '../auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('login')
export class LoginController {
  constructor(private readonly authService: AuthService) {}
  @Post()
  login(@Body() loginDto: LoginDto) {
    const { username, password } = loginDto;
    const isAuthenticated = this.authService.login(username, password);
    if (!isAuthenticated) {
      throw new ForbiddenException({
        success: false,
        message: 'Invalid username or password',
      });
    }
    return { success: true, message: 'Login successful' };
  }
}
