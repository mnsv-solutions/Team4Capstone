import { Injectable, NotFoundException } from '@nestjs/common';

import { FetchAllUsersResponseDto } from '../fetch-all-users/dto/fetch-all-users-response.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FetchAllTeamsResponseDto } from './dto/fetch-all-teams-response.dto.js';
import { FetchTeamUsersRequestDto } from './dto/fetch-team-users-request.dto.js';
import { FetchTeamUsersListResponseDto } from './dto/fetch-team-users-response.dto.js';

type TeamLookupRow = {
  teamId: string;
};

type TeamUserRow = FetchAllUsersResponseDto;
// Service for fetching all teams
@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * This function fetches all teams from the database, and returns them as
   * a FetchAllTeamsResponseDto object. The object contains the teams, along with
   * the count of active team members.
   *
   * First, it fetches all teams from the database, ordered by team name in
   * ascending order. It selects the team's ID, code, name, description, and
   * whether the team is active. It also selects the count of active team members.
   *
   * Then, it maps each team to a FetchAllTeamsResponseDto object, using the team's
   * data and the count of active team members.
   *
   * Finally, it returns a promise that resolves to a FetchAllTeamsResponseDto object.
   *
   * @returns A promise that resolves to a FetchAllTeamsResponseDto object.
   */
  async fetchAllTeams(): Promise<FetchAllTeamsResponseDto> {
    const teams = await this.prisma.teams.findMany({
      // Select the team's ID, code, name, description, and whether the team is active.
      // Also select the count of active team members.
      select: {
        team_id: true,
        team_code: true,
        team_name: true,
        description: true,
        is_active: true,
        _count: {
          // Select the count of active team members.
          select: {
            team_members: {
              // Filter by active team members.
              where: {
                is_active: true,
              },
            },
          },
        },
      },
      // Order the teams by team name in ascending order.
      orderBy: {
        team_name: 'asc',
      },
    });

    // Map each team to a FetchAllTeamsResponseDto object.
    const teamsResponse = teams.map((team) => ({
      teamId: team.team_id,
      teamCode: team.team_code,
      teamName: team.team_name,
      description: team.description,
      userCount: team._count.team_members,
      isActive: team.is_active,
    }));

    // Return a promise that resolves to a FetchAllTeamsResponseDto object.
    return {
      message: 'Teams fetched successfully.',
      data: teamsResponse,
    };
  }
  /**
   * This function fetches all users that belong to a team.
   *
   * It first checks whether the team exists and is active. If the team does not exist, or is not active,
   * it throws a NotFoundException.
   *
   * Then, it fetches all active team members and their role details. It selects the user's ID, name, email, phone number,
   * login status, activity status, block status, and creation date.
   *
   * Finally, it returns a promise that resolves to a FetchTeamUsersListResponseDto object.
   *
   * @param {FetchTeamUsersRequestDto} fetchTeamUsersRequestDto - The request object that contains the team ID.
   * @returns A promise that resolves to a FetchTeamUsersListResponseDto object.
   */
  async fetchTeamUsers(
    fetchTeamUsersRequestDto: FetchTeamUsersRequestDto,
  ): Promise<FetchTeamUsersListResponseDto> {
    const { teamId } = fetchTeamUsersRequestDto;

    // First check whether the team exists and is active
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

    // Then fetch all active team members and their role details
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
