import { Controller, Get, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { FetchAllTeamsResponseDto } from './dto/fetch-all-teams-response.dto.js';
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
}
