import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from '../auth/auth.controller.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersModule } from '../users/users.module.js';
import { FetchUserRoleController } from './fetch-user-role.controller.js';
import { FetchUserRoleService } from './fetch-user-role.service.js';

/**
 * FetchUserRoleModule
 *
 * This module is responsible for providing the fetch user role functionality.
 * It imports the UsersModule and the PrismaModule, and provides the FetchUserRoleController and FetchUserRoleService.
 * The JwtModule is imported and configured with the secret and expiration time from the .env file.
 * The AuthGuard is provided to ensure that only authenticated users can access this module.
 * The AuthService is provided to handle authentication.
 * The JwtModule is exported to make it available to other modules.
 *
 * @module FetchUserRoleModule
 * @imports [UsersModule, PrismaModule]
 * @controllers [AuthController, FetchUserRoleController]
 * @providers [AuthService, AuthGuard, FetchUserRoleService]
 * @exports [AuthService, AuthGuard, JwtModule]
 */
@Module({
  imports: [
    UsersModule,
    PrismaModule,
    JwtModule.registerAsync({
      /**
       * Configure the JwtModule with the secret and expiration time from the .env file.
       *
       * @param {ConfigService} configService - The ConfigService instance.
       * @returns {{ secret: string, signOptions: { expiresIn: number } }} - The configuration for the JwtModule.
       */
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: { expiresIn: configService.get<number>('jwt.expiresIn', 3600) },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, FetchUserRoleController],
  providers: [AuthService, AuthGuard, FetchUserRoleService],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class FetchUserRoleModule {}
