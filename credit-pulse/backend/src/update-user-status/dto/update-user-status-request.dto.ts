import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO for updating user status
 */
export class UpdateUserStatusRequestDto {
  /**
   * User ID to update
   */
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  /**
   * New status of the user
   * active - User is active
   * inactive - User is inactive
   * block - User is blocked
   * unblock - User is unblocked
   */
  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'inactive', 'block', 'unblock'])
  status: 'active' | 'inactive' | 'block' | 'unblock';
}
