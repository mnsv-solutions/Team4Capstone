import { FetchAllUsersResponseDto } from '../../fetch-all-users/dto/fetch-all-users-response.dto.js';

export class FetchTeamUsersListResponseDto {
  // Message returned after fetching users for the selected team
  message!: string;

  // List of users that belong to the team
  data!: FetchAllUsersResponseDto[];
}
