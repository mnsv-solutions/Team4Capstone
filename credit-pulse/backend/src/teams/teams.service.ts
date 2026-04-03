import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { FetchAllTeamsResponseDto } from './dto/fetch-all-teams-response.dto.js';

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
}
