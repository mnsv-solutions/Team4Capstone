import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from '../config/configuration.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaService } from './prisma/prisma.service.js';
import { UsersModule } from './users/users.module.js';
import { ApplicationStatusModule } from './application-status/application-status.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    AuthModule,
    UsersModule,
    ApplicationStatusModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
