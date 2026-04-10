import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Matches, ValidateIf } from 'class-validator';

// This DTO is used to validate the request for assigning an application.
export class AssignApplicationRequestDto {
  // This field stores the application number in the required format.
  @IsString()
  @Matches(/^APPL\d{10}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  applicationNumber?: string;

  // This field stores the team ID when the application is assigned to a team.
  @ValidateIf((o) => !o.assignedUserId || !!o.assignedTeamId)
  @IsOptional()
  @IsUUID()
  assignedTeamId?: string | null;

  // This field stores the user ID when the application is assigned to a specific user.
  @ValidateIf((o) => !o.assignedTeamId || !!o.assignedUserId)
  @IsOptional()
  @IsUUID()
  assignedUserId?: string | null;

  // This field stores any optional remarks related to the assignment.
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  remarks?: string | null;
}
