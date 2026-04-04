import { FetchAllUsersResponseDto } from '../../fetch-all-users/dto/fetch-all-users-response.dto.js';

/**
 * Response object for fetching all users that belong to a team
 */
export class FetchTeamUsersListResponseDto {
  /**
   * Message returned after fetching users for the selected team
   */
  message!: string;

  /**
   * List of users that belong to the team
   * Each user is represented by a FetchAllUsersResponseDto object
   */
  data!: FetchAllUsersResponseDto[];
}
