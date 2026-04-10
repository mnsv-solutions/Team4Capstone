import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../auth/auth.guard.js';
import { FetchTeamApplicationsRequestDto } from './dto/fetch-team-applications-request.dto.js';
import { TeamDashboardDto } from './dto/fetch-team-applications-response.dto.js';
import { FetchTeamApplicationsService } from './fetch-team-applications.service.js';

// This controller handles the API for fetching applications by team.
@Controller('applications')
@UseGuards(AuthGuard)
export class FetchTeamApplicationsController {
  // This constructor injects the service needed to fetch team application data.
  constructor(private readonly FetchTeamApplicationsService: FetchTeamApplicationsService) {}

  // This API returns the list of applications assigned to the given team.
  @Post('fetch-by-team')
  async fetchApplicationsByTeam(
    @Body() dto: FetchTeamApplicationsRequestDto,
  ): Promise<TeamDashboardDto[]> {
    // This sends the team ID and optional status code to the service layer.
    return this.FetchTeamApplicationsService.fetchApplicationsByTeam(
      dto.teamId ?? '',
      dto.statusCode,
    );
  }
}
