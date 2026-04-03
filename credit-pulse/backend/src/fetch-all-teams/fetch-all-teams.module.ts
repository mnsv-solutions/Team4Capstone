import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FetchAllTeamsController } from './fetch-all-teams.controller.js';
import { FetchAllTeamsService } from './fetch-all-teams.service.js';

/**
 * FetchAllTeamsModule
 *
 * This module is responsible for providing the fetch all teams functionality across the application.
 * It imports the PrismaModule and the AuthModule, and provides the FetchAllTeamsController and FetchAllTeamsService.
 * The FetchAllTeamsService is exported to make it available to other modules.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FetchAllTeamsController],
  providers: [FetchAllTeamsService],
  exports: [FetchAllTeamsService],
})
export class FetchAllTeamsModule {}
