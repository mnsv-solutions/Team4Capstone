import { jest } from '@jest/globals';

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  const buildConfigService = (values: Record<string, string | number | undefined>): ConfigService =>
    ({
      get: (key: string, defaultValue?: unknown) => {
        const value = values[key];
        return value === undefined ? defaultValue : value;
      },
    }) as unknown as ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: buildConfigService({
            'db.postgres.host': 'localhost',
            'db.postgres.port': 5432,
            'db.postgres.username': 'postgres',
            'db.postgres.password': '123456',
            'db.postgres.database': 'credit_pulse',
            'db.postgres.schema': 'public',
          }),
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should build database URL using username and default schema', () => {
    const configService = buildConfigService({
      'db.postgres.host': 'localhost',
      'db.postgres.port': 5432,
      'db.postgres.username': 'postgres',
      'db.postgres.password': '123456',
      'db.postgres.database': 'credit_pulse',
    });

    const url = (
      PrismaService as unknown as { getDatabaseUrl: (cfg: ConfigService) => string }
    ).getDatabaseUrl(configService);

    expect(url).toBe('postgresql://postgres:123456@localhost:5432/credit_pulse?schema=public');
  });

  it('should fallback to db.postgres.user when username is not provided', () => {
    const configService = buildConfigService({
      'db.postgres.host': 'localhost',
      'db.postgres.port': 5432,
      'db.postgres.user': 'postgres_fallback',
      'db.postgres.password': '123456',
      'db.postgres.database': 'credit_pulse',
      'db.postgres.schema': 'custom_schema',
    });

    const url = (
      PrismaService as unknown as { getDatabaseUrl: (cfg: ConfigService) => string }
    ).getDatabaseUrl(configService);

    expect(url).toBe(
      'postgresql://postgres_fallback:123456@localhost:5432/credit_pulse?schema=custom_schema',
    );
  });

  it('should throw when any required configuration is missing', () => {
    const configService = buildConfigService({
      'db.postgres.port': 5432,
      'db.postgres.username': 'postgres',
      'db.postgres.password': '123456',
      'db.postgres.database': 'credit_pulse',
      'db.postgres.schema': 'public',
    });

    expect(() => {
      (
        PrismaService as unknown as { getDatabaseUrl: (cfg: ConfigService) => string }
      ).getDatabaseUrl(configService);
    }).toThrow(new Error('Missing database configuration'));
  });

  it('onModuleInit should connect and log success', async () => {
    const mockContext = {
      $connect: jest.fn().mockResolvedValue(undefined),
      logger: { log: jest.fn() },
    };

    await PrismaService.prototype.onModuleInit.call(mockContext as unknown as PrismaService);

    expect(mockContext.$connect).toHaveBeenCalledTimes(1);
    expect(mockContext.logger.log).toHaveBeenCalledWith('Database connected');
  });

  it('onModuleDestroy should disconnect and log success', async () => {
    const mockContext = {
      $disconnect: jest.fn().mockResolvedValue(undefined),
      logger: { log: jest.fn() },
    };

    await PrismaService.prototype.onModuleDestroy.call(mockContext as unknown as PrismaService);

    expect(mockContext.$disconnect).toHaveBeenCalledTimes(1);
    expect(mockContext.logger.log).toHaveBeenCalledWith('Database disconnected');
  });
});
