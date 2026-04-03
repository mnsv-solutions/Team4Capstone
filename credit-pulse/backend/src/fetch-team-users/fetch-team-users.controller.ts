import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { FetchTeamUsersRequestDto } from './dto/fetch-team-users-request.dto.js';
import { FetchTeamUsersListResponseDto } from './dto/fetch-team-users-response.dto.js';
import { FetchTeamUsersService } from './fetch-team-users.service.js';

// Controller for fetching team users
@Controller('team')
export class FetchTeamUsersController {
  constructor(private readonly fetchTeamUsersService: FetchTeamUsersService) {}

  @UseGuards(AuthGuard)
  @Post('fetch-users')
  /**
   * This function fetches all users belonging to a specific team.
   *
   * It takes a FetchTeamUsersRequestDto object as its parameter, which contains the team ID.
   * It then calls the fetchTeamUsers function in the FetchTeamUsersService, passing the FetchTeamUsersRequestDto object.
   * The fetchTeamUsers function in the FetchTeamUsersService fetches all users belonging to the specified team from the database,
   * and returns a promise that resolves to a FetchTeamUsersListResponseDto object.
   * The FetchTeamUsersListResponseDto object contains a message and an array of TeamUserDto objects, each containing the user's ID, role type, name, email, phone number, login status, activity status, block status, and creation date.
   *
   * @param fetchTeamUsersRequestDto The FetchTeamUsersRequestDto object containing the team ID.
   * @return A promise that resolves to a FetchTeamUsersListResponseDto object containing the list of users belonging to the specified team.
   *
   * Steps:
   * 1. Receive the FetchTeamUsersRequestDto object containing the team ID.
   * 2. Call the fetchTeamUsers function in the FetchTeamUsersService, passing the FetchTeamUsersRequestDto object.
   * 3. The fetchTeamUsers function in the FetchTeamUsersService fetches all users belonging to the specified team from the database.
   * 4. The fetchTeamUsers function in the FetchTeamUsersService returns a promise that resolves to a FetchTeamUsersListResponseDto object.
   * 5. The FetchTeamUsersListResponseDto object contains a message and an array of TeamUserDto objects, each containing the user's ID, role type, name, email, phone number, login status, activity status, block status, and creation date.
   * 6. Return the promise that resolves to the FetchTeamUsersListResponseDto object.
   */
  async fetchTeamUsers(
    @Body() fetchTeamUsersRequestDto: FetchTeamUsersRequestDto,
  ): Promise<FetchTeamUsersListResponseDto> {
    return this.fetchTeamUsersService.fetchTeamUsers(fetchTeamUsersRequestDto);
  }
}
