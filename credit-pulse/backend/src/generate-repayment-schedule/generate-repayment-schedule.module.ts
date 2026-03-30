import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { GenerateRepaymentScheduleController } from './generate-repayment-schedule.controller.js';
import { GenerateRepaymentScheduleService } from './generate-repayment-schedule.service.js';

/**
 * GenerateRepaymentScheduleModule
 *
 * This module is responsible for generating repayment schedules for loan applications.
 * It imports the PrismaModule and the AuthModule, and provides the GenerateRepaymentScheduleController and GenerateRepaymentScheduleService.
 *
 * @module GenerateRepaymentScheduleModule
 * @imports [PrismaModule, AuthModule]
 * @controllers [GenerateRepaymentScheduleController]
 * @providers [GenerateRepaymentScheduleService]
 * @exports [GenerateRepaymentScheduleService]
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GenerateRepaymentScheduleController],
  providers: [GenerateRepaymentScheduleService],
  exports: [GenerateRepaymentScheduleService],
})
export class GenerateRepaymentScheduleModule {}
