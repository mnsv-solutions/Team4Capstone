/**
 * Sent back after a user's status is updated.
 * Includes the latest state of the user record
 * so the caller can confirm the change.
 */
export class UpdateUserStatusResponseDto {
  // Result message for the update action
  message: string;

  // Unique id of the updated user
  userId: string;

  // Current status label of the user
  status: string;

  // Shows whether the user is active
  isActive: boolean;

  // Shows whether the user is blocked
  isBlocked: boolean;
}
