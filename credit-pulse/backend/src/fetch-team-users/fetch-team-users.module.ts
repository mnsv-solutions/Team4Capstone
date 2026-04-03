import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FetchTeamUsersController } from './fetch-team-users.controller.js';
import { FetchTeamUsersService } from './fetch-team-users.service.js';

/**
 * FetchTeamUsersModule
 *
 * This module is responsible for providing the fetch team users functionality.
 * It imports the PrismaModule and the AuthModule, and provides the FetchTeamUsersController and FetchTeamUsersService.
 * The FetchTeamUsersService is exported to make it available to other modules.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FetchTeamUsersController],
  providers: [FetchTeamUsersService],
  exports: [FetchTeamUsersService],
})
export class FetchTeamUsersModule {}
