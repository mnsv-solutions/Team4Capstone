import { MODULE_METADATA } from '@nestjs/common/constants';

import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersController } from './users.controller.js';
import { UsersModule } from './users.module.js';
import { UsersService } from './users.service.js';

describe('UsersModule', () => {
  it('should define providers metadata', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, UsersModule);

    expect(providers).toEqual(expect.arrayContaining([UsersService]));
  });

  it('should define imports metadata', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, UsersModule);

    expect(imports).toEqual(expect.arrayContaining([PrismaModule]));
  });

  it('should define exports metadata', () => {
    const exportsMeta = Reflect.getMetadata(MODULE_METADATA.EXPORTS, UsersModule);

    expect(exportsMeta).toEqual(expect.arrayContaining([UsersService]));
  });

  it('should define controllers metadata', () => {
    const controllers = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, UsersModule);

    expect(controllers).toEqual(expect.arrayContaining([UsersController]));
  });
});
