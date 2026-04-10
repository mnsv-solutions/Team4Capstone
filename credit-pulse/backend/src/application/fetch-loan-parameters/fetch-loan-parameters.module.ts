import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { CalculateEligibilityModule } from '../../calculate-eligibility/calculate-eligibility.module.js';
import { CalculateRatiosModule } from '../../calculate-ratios/calculate-ratios.module.js';
import { GenerateRepaymentScheduleModule } from '../../generate-repayment-schedule/generate-repayment-schedule.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { FetchLoanParametersController } from './fetch-loan-parameters.controller.js';
import { FetchLoanParametersService } from './fetch-loan-parameters.service.js';

// This module is used to handle the fetch loan parameters feature.
@Module({
  // These modules are imported because this feature depends on them.
  imports: [
    PrismaModule,
    AuthModule,
    GenerateRepaymentScheduleModule,
    CalculateRatiosModule,
    CalculateEligibilityModule,
  ],

  // This controller handles the incoming API requests for this feature.
  controllers: [FetchLoanParametersController],

  // This service contains the main business logic for this feature.
  providers: [FetchLoanParametersService],

  // This export allows the service to be used in other modules if needed.
  exports: [FetchLoanParametersService],
})
export class FetchLoanParametersModule {}
