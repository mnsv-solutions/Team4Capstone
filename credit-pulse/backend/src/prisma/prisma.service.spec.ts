import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                'db.postgres.host': 'localhost',
                'db.postgres.port': 5432,
                'db.postgres.username': 'postgres',
                'db.postgres.password': '123456',
                'db.postgres.database': 'credit_pulse',
              })[key],
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
