import { PrismaPg } from '@prisma/adapter-pg';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Pool } from 'pg';

import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const url = PrismaService.getDatabaseUrl(configService);
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  private static getDatabaseUrl(configService: ConfigService): string {
    const host = configService.get<string>('db.postgres.host');
    const port = configService.get<number>('db.postgres.port', 5432);
    const user =
      configService.get<string>('db.postgres.username') ??
      configService.get<string>('db.postgres.user');
    const password = configService.get<string>('db.postgres.password');
    const database = configService.get<string>('db.postgres.database');
    const schema = configService.get<string>('db.postgres.schema', 'public');

    if (!host || !port || !user || !password || !database || !schema) {
      throw new Error('Missing database configuration');
    }

    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}`;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
