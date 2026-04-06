/**
 * DTO for the response data of adding a user to a team
 * @property {string} teamId - The ID of the team
 * @property {string} teamName - The name of the team
 * @property {string} userId - The ID of the user
 * @property {string} userName - The name of the user
 */
export class AddUserToTeamResponseDataDto {
  teamId!: string;
  teamName!: string;
  userId!: string;
  userName!: string;
}

/**
 * Response object for adding a user to a team
 * @property {string} message - Response message
 * @property {AddUserToTeamResponseDataDto} data - Response data
 */
export class AddUserToTeamResponseDto {
  message!: string;
  data!: AddUserToTeamResponseDataDto;
}
