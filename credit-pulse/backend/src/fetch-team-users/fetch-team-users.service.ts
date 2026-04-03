import { Injectable, NotFoundException } from '@nestjs/common';

import { FetchAllUsersResponseDto } from '../fetch-all-users/dto/fetch-all-users-response.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FetchTeamUsersRequestDto } from './dto/fetch-team-users-request.dto.js';
import { FetchTeamUsersListResponseDto } from './dto/fetch-team-users-response.dto.js';

/**
 * Represents a single row in the team lookup table.
 *
 * @property {string} teamId - The ID of the team.
 */
type TeamLookupRow = {
  teamId: string;
};

type TeamUserRow = FetchAllUsersResponseDto;

// Service for fetching team users
@Injectable()
export class FetchTeamUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the list of users that are part of a team.
   *
   * @param fetchTeamUsersRequestDto The request object containing the team ID.
   * @returns A promise that resolves to a FetchTeamUsersListResponseDto object containing the list of team users.
   */
  async fetchTeamUsers(
    fetchTeamUsersRequestDto: FetchTeamUsersRequestDto,
  ): Promise<FetchTeamUsersListResponseDto> {
    const { teamId } = fetchTeamUsersRequestDto;

    /**
     * First, we query the database to find the team by its ID.
     * We only select the team ID and make sure the team is active.
     * If the team is not found, we throw a NotFoundException.
     */
    const team = await this.prisma.$queryRaw<TeamLookupRow[]>`
      SELECT t.team_id AS "teamId"
      FROM teams t
      WHERE t.team_id = ${teamId}
        AND t.is_active = true
      LIMIT 1
    `;

    if (!team.length) {
      throw new NotFoundException('Team not found.');
    }

    /**
     * Then, we query the database to find all users that are part of the team.
     * We join the team_members table with the users table and the roles table.
     * We select the user ID, role type, name, email, phone number, logged in status, active status, blocked status, and created at date.
     * We filter the results by the team ID and make sure the team member is active.
     * We order the results by the created at date in descending order.
     */
    const teamUsers = await this.prisma.$queryRaw<TeamUserRow[]>`
      SELECT
        u.user_id AS "userId",
        r.role_code AS "roleType",
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS "name",
        u.email AS "userEmail",
        u.phone AS "phone",
        COALESCE(u.is_logged_in, false) AS "isLoggedIn",
        u.is_active AS "isActive",
        COALESCE(u.is_blocked, false) AS "isBlocked",
        u.created_at AS "createdAt"
      FROM team_members tm
      INNER JOIN users u ON u.user_id = tm.user_id
      INNER JOIN roles r ON r.role_id = u.role_id
      WHERE tm.team_id = ${teamId}
        AND tm.is_active = true
      ORDER BY u.created_at DESC
    `;

    return {
      message: 'Team users fetched successfully.',
      data: teamUsers,
    };
  }
}
