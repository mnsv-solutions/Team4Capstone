import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { FetchCreditScoreController } from './fetch-credit-score.controller.js';
import { FetchCreditScoreService } from './fetch-credit-score.service.js';

// This module groups everything needed for fetching credit score details.
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FetchCreditScoreController],
  providers: [FetchCreditScoreService],
  exports: [FetchCreditScoreService],
})
export class FetchCreditScoreModule {}
