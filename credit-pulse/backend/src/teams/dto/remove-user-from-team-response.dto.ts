/**
 * DTO for the response data of removing a user from a team
 * @property {string} teamId - The ID of the team from which the user was removed
 * @property {string} teamName - The name of the team from which the user was removed
 * @property {string} userId - The ID of the user who was removed from the team
 * @property {string} userName - The name of the user who was removed from the team
 */
export class RemoveUserFromTeamResponseDataDto {
  teamId!: string;
  teamName!: string;
  userId!: string;
  userName!: string;
}

/**
 * Response object for removing a user from a team
 * @property {string} message - Response message
 * @property {RemoveUserFromTeamResponseDataDto} data - Response data
 */
export class RemoveUserFromTeamResponseDto {
  message!: string;
  data!: RemoveUserFromTeamResponseDataDto;
}
