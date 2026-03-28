import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module.js';
import { ApplicationController } from './application.controller.js';
import { ApplicationService } from './application.service.js';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, JwtService],
})
export class ApplicationModule {}
