import { PrismaPostgresAdapter } from '@prisma/adapter-ppg';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient {
  private logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const url = PrismaService.getDatabaseUrl(configService);
    const adapter = new PrismaPostgresAdapter({ connectionString: url });
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
    this.logger.log('Connecting to the database...');
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from the database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
