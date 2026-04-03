import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from '../config/configuration.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ApplicationStatusModule } from './application-status/application-status.module.js';
import { ApplicationModule } from './application/application.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AwsService } from './aws/aws.service.js';
import { CalculateRatiosModule } from './calculate-ratios/calculate-ratios.module.js';
import { CreditScoreCheckModule } from './credit-score-check/credit-score-check.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { FetchAllTeamsModule } from './fetch-all-teams/fetch-all-teams.module.js';
import { FetchAllUsersModule } from './fetch-all-users/fetch-all-users.module.js';
import { FetchUserRoleModule } from './fetch-user-role/fetch-user-role.module.js';
import { GenerateRepaymentScheduleModule } from './generate-repayment-schedule/generate-repayment-schedule.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaService } from './prisma/prisma.service.js';
import { TeamsModule } from './teams/teams.module.js';
import { UpdateUserStatusModule } from './update-user-status/update-user-status.module.js';
import { UploadUsersModule } from './upload-users/upload-users.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    AuthModule,
    UsersModule,
    ApplicationStatusModule,
    DashboardModule,
    CreditScoreCheckModule,
    ApplicationModule,
    GenerateRepaymentScheduleModule,
    CalculateRatiosModule,
    UploadUsersModule,
    UpdateUserStatusModule,
    FetchAllUsersModule,
    TeamsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, PrismaService, AwsService],
})
export class AppModule {}
