export class TeamDto {
  // Unique id of the team
  teamId!: string;

  // Short code used to identify the team
  teamCode!: string;

  // Display name of the team
  teamName!: string;

  // Optional team description
  description!: string | null;

  // Total number of users linked to this team
  userCount!: number;

  // Shows whether the team is currently active
  isActive!: boolean;
}

export class FetchAllTeamsResponseDto {
  // Message returned with the fetch teams response
  message!: string;

  // List of teams returned from the API
  data!: TeamDto[];
}
