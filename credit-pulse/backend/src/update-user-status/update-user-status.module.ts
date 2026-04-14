import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UpdateUserStatusController } from './update-user-status.controller.js';
import { UpdateUserStatusService } from './update-user-status.service.js';

/**
 * UpdateUserStatusModule
 * This module is responsible for updating user status in the database.
 * It imports the PrismaModule and the AuthModule, and provides the UpdateUserStatusController and UpdateUserStatusService.
 * The CheckIsAdmin guard is provided to ensure that only admin users can access this module.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UpdateUserStatusController],
  providers: [UpdateUserStatusService, CheckIsAdmin],
  exports: [UpdateUserStatusService],
})
export class UpdateUserStatusModule {}
