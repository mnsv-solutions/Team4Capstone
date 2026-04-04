import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO for fetching team users
 * @property {string} teamId - The ID of the team for which users need to be fetched
 */
export class FetchTeamUsersRequestDto {
  /**
   * Cleans extra spaces from the incoming team id value
   * @param value - The value to be transformed
   * @returns The transformed value
   */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))

  /**
   * Makes sure team id is provided in the request
   */
  @IsNotEmpty()

  /**
   * Ensures the team id is a valid UUID
   */
  @IsUUID()
  teamId!: string;
}
