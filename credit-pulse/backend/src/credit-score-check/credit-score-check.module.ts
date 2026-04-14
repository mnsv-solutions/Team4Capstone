import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CreditScoreCheckController } from './credit-score-check.controller.js';
import { CreditScoreCheckService } from './credit-score-check.service.js';

/**
 * CreditScoreCheckModule
 *
 * This module is responsible for providing credit score check functionality
 * across the application. It imports the PrismaModule and the AuthModule,
 * and provides the CreditScoreCheckController and CreditScoreCheckService.
 */
// Groups together everything needed for the credit score check feature
@Module({
  // Brings in database access and authentication support
  imports: [PrismaModule, AuthModule],

  // Registers the controller that handles incoming API requests
  controllers: [CreditScoreCheckController],

  // Registers the service that contains the feature logic
  providers: [CreditScoreCheckService],

  // Makes the service available to other modules if needed
  exports: [CreditScoreCheckService],
})
export class CreditScoreCheckModule {}
