import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

// This module handles all dashboard related functionality.
@Module({
  // These modules provide authentication and database support.
  imports: [PrismaModule, AuthModule],

  // This controller handles dashboard API requests.
  controllers: [DashboardController],

  // This service contains the main logic for dashboard data.
  providers: [DashboardService],

  // This export allows the dashboard service to be used in other modules.
  exports: [DashboardService],
})
export class DashboardModule {}
