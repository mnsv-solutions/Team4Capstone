import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { FetchUserRoleResponseDto } from './dto/fetch-user-role-response.dto.js';

// Service for fetching user role
@Injectable()
export class FetchUserRoleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the user's role from the database.
   *
   * This function takes the user's ID and role ID as arguments, and returns a FetchUserRoleResponseDto object containing the user's role information.
   * If the user's ID or role ID is not provided, it throws an UnauthorizedException.
   * If the role is not found, it throws a NotFoundException.
   *
   * @param userId The user's ID.
   * @param roleId The user's role ID.
   * @returns A promise that resolves to a FetchUserRoleResponseDto object.
   */
  async fetchUserRole(userId?: string, roleId?: string): Promise<FetchUserRoleResponseDto> {
    if (!userId || !roleId) {
      throw new UnauthorizedException('Invalid token. User id or role id is missing.');
    }

    // Fetch the role from the database.
    // Select only the role's ID and code.
    // Filter by the role ID and is_active.
    const role = await this.prisma.roles.findFirst({
      where: {
        role_id: roleId,
        is_active: true,
      },
      select: {
        role_id: true,
        role_code: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    // Return the role information as a FetchUserRoleResponseDto object.
    return {
      message: 'User role fetched successfully.',
      data: {
        userId,
        roleId: role.role_id,
        roleCode: role.role_code,
      },
    };
  }
}
