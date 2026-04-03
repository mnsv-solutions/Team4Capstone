import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class FetchTeamUsersRequestDto {
  // Cleans extra spaces from the incoming team id value
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))

  // Makes sure team id is provided in the request
  @IsNotEmpty()

  // Ensures the team id is a valid UUID
  @IsUUID()
  teamId!: string;
}
