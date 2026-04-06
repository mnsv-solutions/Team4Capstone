import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Carries the ids needed to assign a user to a team.
 * Both values are cleaned first and then validated
 * before the request is processed.
 */
export class AddUserToTeamRequestDto {
  // Team id where the user will be added
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsUUID()
  teamId!: string;

  // User id of the person being assigned to the team
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsUUID()
  userId!: string;
}
