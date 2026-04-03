import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { FetchUserRoleResponseDto } from './dto/fetch-user-role-response.dto.js';
import { FetchUserRoleService } from './fetch-user-role.service.js';

// Controller for fetching user role
@Controller('auth')
export class FetchUserRoleController {
  constructor(private readonly fetchUserRoleService: FetchUserRoleService) {}

  @UseGuards(AuthGuard)
  @Get('fetch-user-role')
  /**
   * Fetch the user's role from the database.
   *
   * This function is called when the GET /auth/fetch-user-role endpoint is hit.
   * It requires the user to be authenticated (i.e. the user must have a valid JWT token).
   * The function takes the request object as an argument, which contains information about the authenticated user.
   * The function first extracts the user's ID and role ID from the request object.
   * If the user's ID is not present in the request object, it uses the user's sub (subject) field as the user's ID.
   * If the user's role ID is not present in the request object, it uses the role ID passed in the request body.
   * The function then calls the fetchUserRole function in the FetchUserRoleService to fetch the user's role from the database.
   * The fetchUserRole function takes the user's ID and role ID as arguments, and returns a FetchUserRoleResponseDto object containing the user's role information.
   * The function returns a promise that resolves to a FetchUserRoleResponseDto object.
   */
  async fetchUserRole(
    @Req() req: { user: { sub?: string; userId?: string; role_id?: string } },
  ): Promise<FetchUserRoleResponseDto> {
    const userId = req.user?.sub ?? req.user?.userId;
    const roleId = req.user?.role_id;

    return this.fetchUserRoleService.fetchUserRole(userId, roleId);
  }
}
