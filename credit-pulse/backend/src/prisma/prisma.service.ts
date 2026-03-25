import { PrismaPg } from '@prisma/adapter-pg';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

//Importing the auto-generated database client based on the schema.
import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * The constructor for the PrismaService.
   *
   * This method constructs a new PrismaService instance and initializes it with a PrismaClient.
   * The PrismaClient is initialized with a PrismaPg adapter, which is an adapter for the PostgreSQL database.
   * The adapter is initialized with a connection pool to the database, which is created using the connection string from the configuration service.
   *
   * @param configService - The configuration service which provides access to the application configuration.
   */
  constructor(private configService: ConfigService) {
    // Get the connection string for the database from the configuration service.
    const url = PrismaService.getDatabaseUrl(configService);

    // Create a new PrismaPg adapter for the database, passing in the connection pool.
    const adapter = new PrismaPg({ connectionString: url });

    // Initialize the PrismaService with the adapter.
    super({ adapter });
  }

  /**
   * Get the database URL from the configuration service.
   *
   * This method extracts the database configuration from the configuration service and
   * constructs a database URL using the extracted configuration.
   *
   * The database URL is constructed in the following format:
   * 'postgresql://<user>:<password>@<host>:<port>/<database>?schema=<schema>'
   *
   * If any of the required database configuration values are missing, an error is thrown.
   *
   * @param configService - The configuration service which provides access to the application configuration.
   * @returns The constructed database URL.
   */
  private static getDatabaseUrl(configService: ConfigService): string {
    // Get the database host from the configuration service.
    const host = configService.get<string>('db.postgres.host');

    // Get the database port from the configuration service. If the port is not provided, use the default port (5432).
    const port = configService.get<number>('db.postgres.port', 5432);

    // Get the database username from the configuration service. If the username is not provided, use the database user.
    const user =
      configService.get<string>('db.postgres.username') ??
      configService.get<string>('db.postgres.user');

    // Get the database password from the configuration service.
    const password = configService.get<string>('db.postgres.password');

    // Get the database name from the configuration service.
    const database = configService.get<string>('db.postgres.database');

    // Get the database schema from the configuration service. If the schema is not provided, use the default schema (public).
    const schema = configService.get<string>('db.postgres.schema', 'public');

    // Check if all the required database configuration values are present.
    if (!host || !port || !user || !password || !database || !schema) {
      throw new Error('Missing database configuration');
    }

    // Construct the database URL using the extracted configuration.
    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}`;
  }

  /**
   * Called after the module has been initialized.
   *
   * This lifecycle hook is used to establish a connection to the database.
   * The connection is established by calling the $connect() method on the PrismaService instance.
   * When the connection is successful, a log message is printed to indicate that the database connection has been established.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  /**
   * Called after the module has been destroyed.
   *
   * This lifecycle hook is used to close the connection to the database.
   * The connection is closed by calling the $disconnect() method on the PrismaService instance.
   * When the connection is closed, a log message is printed to indicate that the database connection has been closed.
   */
  async onModuleDestroy(): Promise<void> {
    // Close the connection to the database.
    await this.$disconnect();

    // Print a log message to indicate that the database connection has been closed.
    this.logger.log('Database disconnected');
  }
}
