import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { CalculateEligibilityModule } from '../../calculate-eligibility/calculate-eligibility.module.js';
import { CalculateRatiosModule } from '../../calculate-ratios/calculate-ratios.module.js';
import { GenerateRepaymentScheduleModule } from '../../generate-repayment-schedule/generate-repayment-schedule.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { FetchLoanParametersController } from './fetch-loan-parameters.controller.js';
import { FetchLoanParametersService } from './fetch-loan-parameters.service.js';

// This module brings together everything needed for the fetch-loan-parameters feature.
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GenerateRepaymentScheduleModule,
    CalculateRatiosModule,
    CalculateEligibilityModule,
  ],
  controllers: [FetchLoanParametersController],
  providers: [FetchLoanParametersService],
  exports: [FetchLoanParametersService],
})
export class FetchLoanParametersModule {}
