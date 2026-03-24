import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

/**
 * DashboardModule
 * This module is responsible for providing dashboard-related functionality across the application.
 * It imports the PrismaModule and the AuthModule, and provides the DashboardController and DashboardService.
 */
@Module({

  // Import the PrismaModule and the AuthModule for database access and authentication
  imports: [PrismaModule, AuthModule],

  // Provide the DashboardController for handling dashboard-related requests
  controllers: [DashboardController],

  // Provide the DashboardService for handling dashboard-related business logic
  providers: [DashboardService],

  // Export the DashboardService so it can be used in other modules
  exports: [DashboardService],
})
export class DashboardModule {}
