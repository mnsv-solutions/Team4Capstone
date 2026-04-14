// DTO for fetching all users
// Contains the user's ID, role type, name, email, phone number, login status, activity status, block status, and creation date

export class FetchAllUsersResponseDto {
  // The user's ID
  userId: string;

  // The type of role that the user has
  roleType: string;

  // The user's name
  name: string;

  // The user's email address
  userEmail: string;

  // The user's phone number
  phone: string | null;

  // Whether the user is logged in or not
  isLoggedIn: boolean;

  // Whether the user is active or not
  isActive: boolean;

  // Whether the user is blocked or not
  isBlocked: boolean;

  // The date when the user was created
  createdAt: Date;
}
