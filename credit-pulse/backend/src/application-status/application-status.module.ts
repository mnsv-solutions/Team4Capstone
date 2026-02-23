import { Module } from '@nestjs/common';
import { ApplicationStatusController } from './application-status.controller.js';
import { ApplicationStatusService } from './application-status.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

/**
 * The Application Status Module.
 *
 * This module imports the Prisma Module and provides the Application Status Controller and Service.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ApplicationStatusController],
  providers: [ApplicationStatusService],
})

// Export the Application Status Module
export class ApplicationStatusModule {}
