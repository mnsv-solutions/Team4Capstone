import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FetchAllUsersController } from './fetch-all-users.controller.js';
import { FetchAllUsersService } from './fetch-all-users.service.js';

/**
 * FetchAllUsersModule
 *
 * This module is responsible for providing the fetch all users functionality.
 * It imports the PrismaModule and the AuthModule, and provides the FetchAllUsersController and FetchAllUsersService.
 * The CheckIsAdmin guard is provided to ensure that only admin users can access this module.
 *
 * @module FetchAllUsersModule
 * @imports [PrismaModule, AuthModule]
 * @controllers [FetchAllUsersController]
 * @providers [FetchAllUsersService, CheckIsAdmin]
 * @exports [FetchAllUsersService]
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FetchAllUsersController],
  providers: [FetchAllUsersService, CheckIsAdmin],
  exports: [FetchAllUsersService],
})
export class FetchAllUsersModule {}
