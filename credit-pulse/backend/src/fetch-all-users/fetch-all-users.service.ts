import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { FetchAllUsersResponseDto } from './dto/fetch-all-users-response.dto.js';

@Injectable()
export class FetchAllUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * This function fetches all users from the database, and returns them as
   * an array of FetchAllUsersResponseDto objects. Each object contains the
   * user's ID, role type, name, email, phone number, login status, activity
   * status, block status, and creation date.
   *
   * The function first fetches all users from the database, ordered by creation date in
   * descending order. Then, it fetches all the roles from the database, corresponding to the
   * user's role IDs. Finally, it maps each user to a FetchAllUsersResponseDto object,
   * using the user's data and the role map.
   */
  async getAllUsers(): Promise<FetchAllUsersResponseDto[]> {
    /**
     * Fetch all users from the database, ordered by creation date in descending order.
     * Select only the user's ID, role ID, first name, last name, email, phone number, login status, activity status, block status, and creation date.
     */
    const users = await this.prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        user_id: true,
        role_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        is_logged_in: true,
        is_active: true,
        is_blocked: true,
        created_at: true,
      },
    });

    // Fetch all the roles from the database, corresponding to the user's role IDs.
    // Select only the role's ID and code.
    const roleIds = [...new Set(users.map((user) => user.role_id))];
    const roles = await this.prisma.roles.findMany({
      where: {
        role_id: {
          in: roleIds,
        },
      },
      select: {
        role_id: true,
        role_code: true,
      },
    });

    //Create a Map to map a role ID to its corresponding role code.
    const roleMap = new Map(roles.map((role) => [role.role_id, role.role_code]));

    // Map each user to a FetchAllUsersResponseDto object, using the user's data and the role map.
    return users.map((user) => ({
      userId: user.user_id,
      roleType: roleMap.get(user.role_id) ?? '',
      name: `${user.first_name} ${user.last_name}`,
      userEmail: user.email,
      phone: user.phone,
      isLoggedIn: user.is_logged_in,
      isActive: user.is_active,
      isBlocked: user.is_blocked,
      createdAt: user.created_at,
    }));
  }
}
