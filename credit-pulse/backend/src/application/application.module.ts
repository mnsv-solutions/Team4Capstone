import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AwsService } from '../aws/aws.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ApplicationController } from './application.controller.js';
import { ApplicationService } from './application.service.js';
import { ApplicationCommunicationModule } from './communication/application-communication.module.js';
import { ApplicationStageModule } from './stage/application-stage.module.js';

@Module({
  imports: [PrismaModule, ConfigModule, ApplicationCommunicationModule, ApplicationStageModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, JwtService, AwsService],
})
export class ApplicationModule {}
