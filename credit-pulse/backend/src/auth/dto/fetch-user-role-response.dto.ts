/**
 * DTO for fetching user role
 * Contains the response message and the user's role data
 * @property {string} message - Response message
 * @property {object} data - User role data
 * @property {string} data.userId - User ID
 * @property {string} data.firstName - User first name
 * @property {string} data.lastName - User last name
 * @property {string} data.roleId - Role ID
 * @property {string} data.roleCode - Role code
 * @property {string | null} data.teamId - Active team ID if the user belongs to a team
 */
export class FetchUserRoleResponseDto {
  message!: string;
  data!: {
    userId: string;
    firstName: string;
    lastName: string;
    roleId: string;
    roleCode: string;
    teamId: string | null;
  };
}
