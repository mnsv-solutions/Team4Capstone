import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

// This DTO is used to validate the request for fetching team applications.
export class FetchTeamApplicationsRequestDto {
  // This field stores the team ID whose applications need to be fetched.
  @IsUUID()
  teamId?: string;

  // This field stores the optional status code used to filter applications.
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  statusCode?: string | null;
}
