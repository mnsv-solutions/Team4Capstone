import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';

/**
 * FetchAllTeamsModule
 *
 * This module is responsible for providing the fetch all teams functionality across the application.
 * It imports the PrismaModule and the AuthModule, and provides the TeamsController and TeamsService.
 * The TeamsService is exported to make it available to other modules.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
