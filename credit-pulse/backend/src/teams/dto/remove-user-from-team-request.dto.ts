import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Carries the ids needed to remove a user from a team.
 * Both values are cleaned first and then validated
 * before the request is processed.
 */
export class RemoveUserFromTeamRequestDto {
  // Team id from which the user will be removed
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsUUID()
  teamId!: string;

  // User id of the person being removed from the team
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsUUID()
  userId!: string;
}
