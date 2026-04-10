import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { FetchTeamApplicationsController } from './fetch-team-applications.controller.js';
import { FetchTeamApplicationsService } from './fetch-team-applications.service.js';

// This module handles all features related to fetching applications by team.
@Module({
  // These modules provide authentication and database support.
  imports: [PrismaModule, AuthModule],

  // This controller handles the API requests for team-based application fetching.
  controllers: [FetchTeamApplicationsController],

  // This service contains the main logic for fetching team applications.
  providers: [FetchTeamApplicationsService],

  // This export makes the service available in other modules if needed.
  exports: [FetchTeamApplicationsService],
})
export class FetchTeamApplicationsModule {}
