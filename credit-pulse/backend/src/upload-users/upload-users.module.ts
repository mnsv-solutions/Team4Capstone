import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UploadUsersController } from './upload-users.controller.js';
import { UploadUsersService } from './upload-users.service.js';

/**
 * UploadUsersModule
 *
 * This module is responsible for providing upload users functionality
 * across the application. It imports the PrismaModule and the AuthModule,
 * and provides the UploadUsersController and UploadUsersService.
 *
 * The CheckIsAdmin guard is provided to ensure that only admin users can
 * access this module.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UploadUsersController],
  providers: [UploadUsersService, CheckIsAdmin],
})
export class UploadUsersModule {}
