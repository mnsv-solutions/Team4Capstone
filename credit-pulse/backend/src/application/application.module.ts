import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module.js';
import { ApplicationController } from './application.controller.js';
import { ApplicationService } from './application.service.js';
import { ApplicationCommunicationModule } from './communication/application-communication.module.js';

@Module({
  imports: [PrismaModule, ConfigModule, ApplicationCommunicationModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, JwtService],
})
export class ApplicationModule {}
