import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * PrismaModule
 *
 * This module is responsible for providing database access
 * across the application using Prisma ORM.
 *
 * By exporting PrismaService, other modules can inject
 * and use it for database operations.
 */
@Module({

  // Services created and managed by this module
  providers: [PrismaService],

  // Makes PrismaService available to other modules
  exports: [PrismaService],
})
export class PrismaModule {}