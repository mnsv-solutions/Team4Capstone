import { Module } from '@nestjs/common';
import { LoginController } from './login/login.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [LoginController],
  providers: [AuthService]
})
export class AuthModule {}
