import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CalculateRatiosController } from './calculate-ratios.controller.js';
import { CalculateRatiosService } from './calculate-ratios.service.js';

/**
 * CalculateRatiosModule
 *
 * This module is responsible for providing the calculate ratios functionality across the application.
 * It imports the PrismaModule and the AuthModule, and provides the CalculateRatiosController and CalculateRatiosService.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CalculateRatiosController],
  providers: [CalculateRatiosService],
  exports: [CalculateRatiosService],
})
export class CalculateRatiosModule {}
