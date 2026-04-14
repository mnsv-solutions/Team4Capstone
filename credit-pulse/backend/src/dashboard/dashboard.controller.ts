import { Controller, Get, Logger, Req, UnauthorizedException, UseGuards } from '@nestjs/common';

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
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  // This API returns the list of applications shown on the dashboard.
  @Get('applications')
  async getApplications(@Req() req: AuthenticatedRequest): Promise<DashboardDto[]> {
    this.logger.log('A request was received to fetch dashboard applications.');

    // This gets the logged-in user ID and role ID from the token.
    const userId = req.user?.sub;
    const roleId = req.user?.role_id;

    // This checks whether the user is properly authenticated.
    if (!userId || !roleId) {
      this.logger.warn(
        'The dashboard request could not continue because the user was not authenticated.',
      );
      throw new UnauthorizedException('User not authenticated');
    }

    this.logger.log(`The dashboard request is being processed for user ID: ${userId}.`);

    // This sends the user details to the service layer to fetch dashboard applications.
    return this.dashboardService.getApplicationsForDashboard(userId, roleId);
  }
}
