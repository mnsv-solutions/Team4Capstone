import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';

import { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardDto } from './dto/dashboard.dto.js';

// This type is used for requests that include user details from the JWT token.
type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

// This controller handles dashboard related API requests.
@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // This API returns the list of applications shown on the dashboard.
  @Get('applications')
  async getApplications(@Req() req: AuthenticatedRequest): Promise<DashboardDto[]> {
    // This gets the logged-in user ID and role ID from the token.
    const userId = req.user?.sub;
    const roleId = req.user?.role_id;

    // This checks whether the user is properly authenticated.
    if (!userId || !roleId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // This sends the user details to the service layer to fetch dashboard applications.
    return this.dashboardService.getApplicationsForDashboard(userId, roleId);
  }
}
