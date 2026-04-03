/**
 * DTO for fetching user role
 * Contains the response message and the user's role data
 * @property {string} message - Response message
 * @property {object} data - User role data
 * @property {string} data.userId - User ID
 * @property {string} data.roleId - Role ID
 * @property {string} data.roleCode - Role code
 */
export class FetchUserRoleResponseDto {
  message!: string;
  data!: {
    userId: string;
    roleId: string;
    roleCode: string;
  };
}
