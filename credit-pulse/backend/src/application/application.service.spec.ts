import { jest } from '@jest/globals';

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AwsService } from '../aws/aws.service.js';
import { CreditScoreCheckService } from '../credit-score-check/credit-score-check.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApplicationService } from './application.service.js';
import { AssignApplicationService } from './assignment/application-assignment.service.js';
import { ApplicationCommunicationService } from './communication/application-communication.service.js';
import { ApplicationStageService } from './stage/application-stage.service.js';

describe('ApplicationService', () => {
  let service: ApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        {
          provide: PrismaService,
          useValue: {},
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AwsService, useValue: {} },
        { provide: ApplicationStageService, useValue: {} },
        { provide: ApplicationCommunicationService, useValue: {} },
        { provide: CreditScoreCheckService, useValue: {} },
        { provide: AssignApplicationService, useValue: {} },
      ],
    }).compile();

    service = module.get<ApplicationService>(ApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
