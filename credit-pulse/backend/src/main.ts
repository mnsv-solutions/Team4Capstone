import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting bootstrap Credit Pulse Backend...');

  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('http.port', 3022);

  logger.log(`Listening on port ${port}...`);

  await app.listen(port).catch((err) => {
    logger.error('Failed to keep server running', err);
    process.exit(1);
  });
}

await bootstrap();
