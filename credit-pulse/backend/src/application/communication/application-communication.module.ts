import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ApplicationCommunicationController } from './application-communication.controller.js';
import { ApplicationCommunicationService } from './application-communication.service.js';

// Wraps all application communication related pieces in one module
@Module({
  // Adds database access and authentication support
  imports: [PrismaModule, AuthModule],

  // Registers the controller for communication endpoints
  controllers: [ApplicationCommunicationController],

  // Registers the service that contains the main business logic
  providers: [ApplicationCommunicationService],

  // Exposes the service so other modules can use it if needed
  exports: [ApplicationCommunicationService],
})
export class ApplicationCommunicationModule {}
