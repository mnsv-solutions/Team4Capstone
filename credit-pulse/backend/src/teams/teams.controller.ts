import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { FetchAllTeamsResponseDto } from './dto/fetch-all-teams-response.dto.js';
import { FetchTeamUsersRequestDto } from './dto/fetch-team-users-request.dto.js';
import { FetchTeamUsersListResponseDto } from './dto/fetch-team-users-response.dto.js';
import { TeamsService } from './teams.service.js';

/**
 * Controller for fetching all teams
 *
 * This controller contains a single function, fetchAllTeams, which retrieves all teams from the database.
 * The function calls the fetchAllTeams function in the TeamsService and returns a promise that resolves to a FetchAllTeamsResponseDto object.
 * The FetchAllTeamsResponseDto object contains a message and an array of TeamDto objects, each containing the team's ID, code, name, description, user count, and activity status.
 */
@Controller('teams')
export class TeamsController {
  constructor(private readonly TeamsService: TeamsService) {}

  @UseGuards(AuthGuard, CheckIsAdmin)
  @Get('all')
  /**
   * Retrieves all teams from the database.
   *
   * @return A promise that resolves to a FetchAllTeamsResponseDto object.
   */
  async fetchAllTeams(): Promise<FetchAllTeamsResponseDto> {
    // Call the fetchAllTeams function in the TeamsService
    // to retrieve all teams from the database.
    return await this.TeamsService.fetchAllTeams();
  }
  @UseGuards(AuthGuard, CheckIsAdmin)
  @Post('fetch-users')
  /**
   * Retrieves all users belonging to a given team.
   *
   * @param fetchTeamUsersRequestDto - The FetchTeamUsersRequestDto object containing the team ID.
   *
   * @returns A promise that resolves to a FetchTeamUsersListResponseDto object containing the team's users.
   */
  async fetchTeamUsers(
    @Body()
    fetchTeamUsersRequestDto: FetchTeamUsersRequestDto,
  ): Promise<FetchTeamUsersListResponseDto> {
    // Call the fetchTeamUsers function in the TeamsService
    // to retrieve all users belonging to the given team.
    return this.TeamsService.fetchTeamUsers(fetchTeamUsersRequestDto);
  }
}
