import { Controller, Get, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { FetchAllUsersResponseDto } from './dto/fetch-all-users-response.dto.js';
import { FetchAllUsersService } from './fetch-all-users.service.js';

// Controller for fetching all users
@Controller('users')
export class FetchAllUsersController {
  constructor(private readonly usersService: FetchAllUsersService) {}

  @UseGuards(AuthGuard, CheckIsAdmin)
  @Get('all')
  /**
   * Retrieves all users in the database.
   *
   * This function calls the getAllUsers function in the FetchAllUsersService
   * and returns an array of FetchAllUsersResponseDto objects.
   * Each FetchAllUsersResponseDto object contains the user's ID, role type, name, email, phone number, login status, activity status, block status, and creation date.
   *
   * @return A promise that resolves to an array of FetchAllUsersResponseDto objects.
   */
  async fetchAllUsers(): Promise<FetchAllUsersResponseDto[]> {
    // Call the getAllUsers function in the FetchAllUsersService
    // to retrieve all users in the database.
    return this.usersService.getAllUsers();
  }
}
