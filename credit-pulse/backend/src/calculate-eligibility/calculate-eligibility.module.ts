import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CalculateEligibilityController } from './calculate-eligibility.controller.js';
import { CalculateEligibilityService } from './calculate-eligibility.service.js';

/**
 * CalculateEligibilityModule
 *
 * This module is responsible for providing the calculate eligibility functionality across the application.
 * It imports the PrismaModule and the AuthModule, and provides the CalculateEligibilityController and CalculateEligibilityService.
 * @module CalculateEligibilityModule
 * @imports [PrismaModule, AuthModule]
 * @controllers [CalculateEligibilityController]
 * @providers [CalculateEligibilityService]
 * @exports [CalculateEligibilityService]
 */
// Groups together everything needed for the eligibility calculation feature
@Module({
  // Adds database access and authentication support to this module
  imports: [PrismaModule, AuthModule],

  // Registers the controller that handles eligibility API requests
  controllers: [CalculateEligibilityController],

  // Registers the service that contains the eligibility calculation logic
  providers: [CalculateEligibilityService],

  // Makes the service available to other modules if they need to use it
  exports: [CalculateEligibilityService],
})
export class CalculateEligibilityModule {}
