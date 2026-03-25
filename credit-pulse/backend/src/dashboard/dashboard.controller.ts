import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';

import { Request } from 'express';

// Local imports for the Dashboard Controller
import { AuthGuard } from '../auth/auth.guard.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardDto } from './dto/dashboard.dto.js';

/**
 * Type representing an Express Request object with an optional user property.
 * This is used to type-check requests that have been authenticated.
 */
type AuthenticatedRequest = Request & {
  // The user that made the request, if authenticated.
  // This is populated by the AuthGuard.
  user?: JwtPayload;
};

/**
 * The Dashboard Controller.
 * This controller handles requests related to the dashboard.
 */
@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get('applications')
  /**
   * Retrieves the applications created by a user.
   * This endpoint is protected by the AuthGuard, so only authenticated users can access it.
   * @param req - The authenticated request.
   * The request object contains a 'user' property, which is populated by the AuthGuard if the user is successfully authenticated.
   * The 'user' property contains the user ID, which is used to identify the applications created by the user.
   * @returns An array of Dashboard Dto objects, representing the applications
   * created by the user.
   */
  async getApplications(@Req() req: AuthenticatedRequest): Promise<DashboardDto[]> {
    const userId = req.user?.sub;

    // If the user ID is not present, the user is not authenticated.
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Retrieve the applications created by the user.
    return this.dashboardService.getApplicationsCreatedByUser(userId);
  }
}
