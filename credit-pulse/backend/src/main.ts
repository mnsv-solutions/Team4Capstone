import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting bootstrap Credit Pulse Backend...');

  const app = await NestFactory.create(AppModule, { cors: true });

  /**
   * Global Validation Pipe
   *
   * Automatically validates all incoming DTO requests.
   * Ensures clean, secure, and structured input data.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Removes properties not defined in DTO
      forbidNonWhitelisted: true, // Throws error if unknown properties are sent
      transform: true, // Automatically transforms payload to DTO class types
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('http.port', 3022);

  logger.log(`Listening on port ${port}...`);

  await app.listen(port).catch((err) => {
    logger.error('Failed to keep server running', err);
    process.exit(1);
  });
}

await bootstrap();
