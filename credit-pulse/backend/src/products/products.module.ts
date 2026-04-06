import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

// Groups all product-related files under one NestJS module
@Module({
  // Adds database access and authentication support
  imports: [PrismaModule, AuthModule],

  // Registers the controller that handles product APIs
  controllers: [ProductsController],

  // Registers the service that contains product business logic
  providers: [ProductsService],

  // Exposes the service for use in other modules if needed
  exports: [ProductsService],
})
export class ProductsModule {}
