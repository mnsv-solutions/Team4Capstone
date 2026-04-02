import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CheckIsAdmin implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role_id?: string } | undefined;

    if (!user?.role_id) {
      throw new ForbiddenException('User role is missing in JWT payload.');
    }

    const role = await this.prisma.roles.findUnique({
      where: { role_id: user.role_id },
      select: { role_code: true, is_active: true },
    });

    if (!role || !role.is_active || role.role_code !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN users can access this resource.');
    }

    return true;
  }
}
