import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ApplicationStageController } from './application-stage.controller.js';
import { ApplicationStageService } from './application-stage.service.js';

// This module is responsible for handling application stages.
@Module({
  // These imported modules provide database access and authentication support.
  imports: [PrismaModule, AuthModule],

  // This controller handles incoming API requests for application stages.
  controllers: [ApplicationStageController],

  // This service contains the main business logic for application stages.
  providers: [ApplicationStageService],

  // This export makes the service available to other modules if needed.
  exports: [ApplicationStageService],
})
export class ApplicationStageModule {}
