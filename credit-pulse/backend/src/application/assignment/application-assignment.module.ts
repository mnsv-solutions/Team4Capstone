import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AssignApplicationController } from './application-assignment.controller.js';
import { AssignApplicationService } from './application-assignment.service.js';

// This module handles all application assignment related functionality.
@Module({
  // These modules provide database access and authentication support.
  imports: [PrismaModule, AuthModule],

  // This controller handles assignment related API requests.
  controllers: [AssignApplicationController],

  // This service contains the main assignment related business logic.
  providers: [AssignApplicationService],

  // This export allows other modules to use the assignment service if needed.
  exports: [AssignApplicationService],
})
export class AssignApplicationModule {}
