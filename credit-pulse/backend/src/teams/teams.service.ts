import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { FetchAllUsersResponseDto } from '../fetch-all-users/dto/fetch-all-users-response.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddUserToTeamRequestDto } from './dto/add-user-to-team-request.dto.js';
import { AddUserToTeamResponseDto } from './dto/add-user-to-team-response.dto.js';
import { FetchAllTeamsResponseDto } from './dto/fetch-all-teams-response.dto.js';
import { FetchTeamUsersRequestDto } from './dto/fetch-team-users-request.dto.js';
import { FetchTeamUsersListResponseDto } from './dto/fetch-team-users-response.dto.js';
import { RemoveUserFromTeamRequestDto } from './dto/remove-user-from-team-request.dto.js';
import { RemoveUserFromTeamResponseDto } from './dto/remove-user-from-team-response.dto.js';

type TeamLookupRow = {
  teamId: string;
};

type TeamUserRow = FetchAllUsersResponseDto;

const TEAM_ROLE_MAPPING: Record<string, string> = {
  SOURCING_TEAM: 'SOURCING_OFFICER',
  UNDERWRITER_TEAM: 'UNDERWRITER',
  DISBURSAL_TEAM: 'DISBURSAL_OFFICER',
};
// Service for fetching all teams
@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * This function fetches all teams from the database, and returns them as
   * a FetchAllTeamsResponseDto object. The object contains the teams, along with
   * the count of active team members.
   *
   * First, it fetches all teams from the database, ordered by team name in
   * ascending order. It selects the team's ID, code, name, description, and
   * whether the team is active. It also selects the count of active team members.
   *
   * Then, it maps each team to a FetchAllTeamsResponseDto object, using the team's
   * data and the count of active team members.
   *
   * Finally, it returns a promise that resolves to a FetchAllTeamsResponseDto object.
   *
   * @returns A promise that resolves to a FetchAllTeamsResponseDto object.
   */
  async fetchAllTeams(): Promise<FetchAllTeamsResponseDto> {
    this.logger.log('The team list fetch process has started.');

    const teams = await this.prisma.teams.findMany({
      // Select the team's ID, code, name, description, and whether the team is active.
      // Also select the count of active team members.
      select: {
        team_id: true,
        team_code: true,
        team_name: true,
        description: true,
        is_active: true,
        _count: {
          // Select the count of active team members.
          select: {
            team_members: {
              // Filter by active team members.
              where: {
                is_active: true,
              },
            },
          },
        },
      },
      // Order the teams by team name in ascending order.
      orderBy: {
        team_name: 'asc',
      },
    });

    this.logger.log(`The team list was fetched successfully. Total records found: ${teams.length}`);

    // Map each team to a FetchAllTeamsResponseDto object.
    const teamsResponse = teams.map((team) => ({
      teamId: team.team_id,
      teamCode: team.team_code,
      teamName: team.team_name,
      description: team.description,
      userCount: team._count.team_members,
      isActive: team.is_active,
    }));

    // Return a promise that resolves to a FetchAllTeamsResponseDto object.
    return {
      message: 'Teams fetched successfully.',
      data: teamsResponse,
    };
  }
  /**
   * This function fetches all users that belong to a team.
   *
   * It first checks whether the team exists and is active. If the team does not exist, or is not active,
   * it throws a NotFoundException.
   *
   * Then, it fetches all active team members and their role details. It selects the user's ID, name, email, phone number,
   * login status, activity status, block status, and creation date.
   *
   * Finally, it returns a promise that resolves to a FetchTeamUsersListResponseDto object.
   *
   * @param {FetchTeamUsersRequestDto} fetchTeamUsersRequestDto - The request object that contains the team ID.
   * @returns A promise that resolves to a FetchTeamUsersListResponseDto object.
   */
  async fetchTeamUsers(
    fetchTeamUsersRequestDto: FetchTeamUsersRequestDto,
  ): Promise<FetchTeamUsersListResponseDto> {
    const { teamId } = fetchTeamUsersRequestDto;

    this.logger.log(`The team users fetch process has started for team ID: ${teamId}`);

    // First check whether the team exists and is active
    const team = await this.prisma.$queryRaw<TeamLookupRow[]>`
      SELECT t.team_id AS "teamId"
      FROM teams t
      WHERE t.team_id = ${teamId}
        AND t.is_active = true
      LIMIT 1
    `;

    if (!team.length) {
      this.logger.warn(
        `The team users request could not continue because team ID ${teamId} was not found.`,
      );
      throw new NotFoundException('Team not found.');
    }

    this.logger.log('The selected team was found successfully.');

    // Then fetch all active team members and their role details
    const teamUsers = await this.prisma.$queryRaw<TeamUserRow[]>`
      SELECT
        u.user_id AS "userId",
        r.role_code AS "roleType",
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS "name",
        u.email AS "userEmail",
        u.phone AS "phone",
        COALESCE(u.is_logged_in, false) AS "isLoggedIn",
        u.is_active AS "isActive",
        COALESCE(u.is_blocked, false) AS "isBlocked",
        u.created_at AS "createdAt"
      FROM team_members tm
      INNER JOIN users u ON u.user_id = tm.user_id
      INNER JOIN roles r ON r.role_id = u.role_id
      WHERE tm.team_id = ${teamId}
        AND tm.is_active = true
      ORDER BY u.created_at DESC
    `;

    this.logger.log(
      `The team users were fetched successfully. Total records found: ${teamUsers.length}`,
    );

    return {
      message: 'Team users fetched successfully.',
      data: teamUsers,
    };
  }
  /**
   * Adds a user to a team.
   * The function first checks whether the team exists and is active.
   * If the team is not found, or is not active, it throws a NotFoundException.
   *
   * Then, it checks whether the user exists and is active.
   * If the user is not found, or is not active, it throws a NotFoundException.
   *
   * Next, it checks whether the user's role is valid for the team.
   * If the user's role is not valid for the team, it throws a BadRequestException.
   *
   * Then, it checks whether the user is already assigned to this team.
   * If the user is already assigned to this team, it throws a BadRequestException.
   *
   * After that, it checks whether the user is already assigned to another team.
   * If the user is already assigned to another team, it throws a BadRequestException.
   *
   * If the user is not already assigned to this team, but is already assigned to another team,
   * it throws a BadRequestException.
   *
   * Finally, it checks whether the user is already assigned to this team, but is inactive.
   * If the user is already assigned to this team, but is inactive, it updates the team member to be active.
   * If the user is not already assigned to this team, it creates a new team member.
   *
   * @param {AddUserToTeamRequestDto} addUserToTeamRequestDto - The request object containing the team ID and user ID.
   * @returns {Promise<AddUserToTeamResponseDto>} - A promise that resolves to an AddUserToTeamResponseDto object containing the team's details.
   */
  async addUserToTeam(
    addUserToTeamRequestDto: AddUserToTeamRequestDto,
  ): Promise<AddUserToTeamResponseDto> {
    const { teamId, userId } = addUserToTeamRequestDto;

    this.logger.log(`The add user to team process has started for team ID: ${teamId}`);

    // First, check whether the team exists and is active
    const team = await this.prisma.teams.findFirst({
      where: {
        team_id: teamId,
        is_active: true,
      },
      select: {
        team_id: true,
        team_code: true,
        team_name: true,
      },
    });

    if (!team) {
      this.logger.warn(
        `The add user request could not continue because team ID ${teamId} was not found.`,
      );
      throw new NotFoundException('Team not found.');
    }

    this.logger.log(`The selected team was found successfully: ${team.team_name}`);

    // Then check whether the user exists and is active
    const user = await this.prisma.users.findFirst({
      where: {
        user_id: userId,
        is_active: true,
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        role_id: true,
      },
    });

    if (!user) {
      this.logger.warn(
        `The add user request could not continue because user ID ${userId} was not found.`,
      );
      throw new NotFoundException('User not found.');
    }

    this.logger.log('The selected user was found successfully.');

    // Next, check whether the user's role is valid for the team
    const role = await this.prisma.roles.findFirst({
      where: {
        role_id: user.role_id,
        is_active: true,
      },
      select: {
        role_code: true,
      },
    });

    if (!role) {
      this.logger.warn(
        'The add user request could not continue because the user role was not found.',
      );
      throw new NotFoundException('User role not found.');
    }

    const expectedRoleCode = TEAM_ROLE_MAPPING[team.team_code];

    if (!expectedRoleCode) {
      this.logger.warn(
        `The add user request could not continue because team code ${team.team_code} is not supported.`,
      );
      throw new BadRequestException('Unsupported team code.');
    }

    if (role.role_code !== expectedRoleCode) {
      this.logger.warn(
        `The add user request was blocked because role ${role.role_code} does not match team ${team.team_code}.`,
      );
      throw new BadRequestException(
        `User role ${role.role_code} can only be assigned to ${team.team_code}.`,
      );
    }

    this.logger.log('The user role was verified successfully for the selected team.');

    // Check whether the user is already assigned to this team
    const existingActiveTeamMember = await this.prisma.team_members.findFirst({
      where: {
        team_id: teamId,
        user_id: userId,
        is_active: true,
      },
      select: {
        team_member_id: true,
      },
    });

    if (existingActiveTeamMember) {
      this.logger.warn(
        'The add user request was blocked because the user is already assigned to this team.',
      );
      throw new BadRequestException('User is already assigned to this team.');
    }

    // Check whether the user is already assigned to another team
    const existingOtherActiveTeamMember = await this.prisma.team_members.findFirst({
      where: {
        user_id: userId,
        is_active: true,
        NOT: {
          team_id: teamId,
        },
      },
      select: {
        team_member_id: true,
      },
    });

    if (existingOtherActiveTeamMember) {
      this.logger.warn(
        'The add user request was blocked because the user is already assigned to another team.',
      );
      throw new BadRequestException(
        'User is already assigned to another team. Remove the user from the current team first.',
      );
    }

    // Check whether the user is already assigned to this team but is inactive
    const existingInactiveTeamMember = await this.prisma.team_members.findFirst({
      where: {
        team_id: teamId,
        user_id: userId,
        is_active: false,
      },
      select: {
        team_member_id: true,
      },
    });

    if (existingInactiveTeamMember) {
      this.logger.log('An inactive team mapping was found, so it will be reactivated.');

      // If the user is already assigned but is inactive, update the team member to be active
      await this.prisma.team_members.update({
        where: {
          team_member_id: existingInactiveTeamMember.team_member_id,
        },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
      });
    } else {
      this.logger.log(
        'No existing team mapping was found, so a new team member record will be created.',
      );

      // If the user is not already assigned to this team, create a new team member
      await this.prisma.team_members.create({
        data: {
          team_member_id: randomUUID(),
          team_id: teamId,
          user_id: userId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    const userName = `${user.first_name} ${user.last_name}`.trim();

    this.logger.log(`${userName} was added to team ${team.team_name} successfully.`);

    return {
      message: `${userName} is successfully added to ${team.team_name}.`,
      data: {
        teamId: team.team_id,
        teamName: team.team_name,
        userId: user.user_id,
        userName,
      },
    };
  }
  /**
   * Removes a user from a team.
   *
   * This function first checks whether the team and user exist in the database.
   * If either the team or user does not exist, it throws a NotFoundException.
   *
   * Then, it checks whether the user is already assigned to the given team.
   * If the user is already assigned to the team and is active, it throws a BadRequestException.
   * If the user is already assigned to the team but is inactive, it updates the team member to be active.
   * If the user is not already assigned to the team, it creates a new team member.
   *
   * Finally, it constructs a response object containing the team's details and returns it.
   *
   * @param {RemoveUserFromTeamRequestDto} removeUserFromTeamRequestDto - The request object containing the team ID and user ID.
   * @returns {Promise<RemoveUserFromTeamResponseDto>} - A promise that resolves to a RemoveUserFromTeamResponseDto object containing the team's details.
   */
  async removeUserFromTeam(
    removeUserFromTeamRequestDto: RemoveUserFromTeamRequestDto,
  ): Promise<RemoveUserFromTeamResponseDto> {
    // Takes team id and user id from the request body
    const { teamId, userId } = removeUserFromTeamRequestDto;

    this.logger.log(`The remove user from team process has started for team ID: ${teamId}`);

    // Checks whether the team exists and is active
    const team = await this.prisma.teams.findFirst({
      where: {
        team_id: teamId,
        is_active: true,
      },
      select: {
        team_id: true,
        team_name: true,
      },
    });

    // Stops the flow if the team is not found
    if (!team) {
      this.logger.warn(
        `The remove user request could not continue because team ID ${teamId} was not found.`,
      );
      throw new NotFoundException('Team not found.');
    }

    this.logger.log(`The selected team was found successfully: ${team.team_name}`);

    // Checks whether the user exists
    const user = await this.prisma.users.findFirst({
      where: {
        user_id: userId,
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
      },
    });

    // Stops the flow if the user is not found
    if (!user) {
      this.logger.warn(
        `The remove user request could not continue because user ID ${userId} was not found.`,
      );
      throw new NotFoundException('User not found.');
    }

    this.logger.log('The selected user was found successfully.');

    // Finds the active team membership for this user and team
    const activeTeamMember = await this.prisma.team_members.findFirst({
      where: {
        team_id: teamId,
        user_id: userId,
        is_active: true,
      },
      select: {
        team_member_id: true,
      },
    });

    // Throws an error if the user is not currently an active member of the team
    if (!activeTeamMember) {
      this.logger.warn(
        'The remove user request could not continue because the user is not mapped to this team.',
      );
      throw new NotFoundException('User is not mapped to this team.');
    }

    this.logger.log('The active team membership was found successfully.');

    // Soft deletes the membership by marking it as inactive
    await this.prisma.team_members.update({
      where: {
        team_member_id: activeTeamMember.team_member_id,
      },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    // Builds the full user name for the response message
    const userName = `${user.first_name} ${user.last_name}`.trim();

    this.logger.log(`${userName} was removed from team ${team.team_name} successfully.`);

    return {
      message: `${userName} is successfully removed from Team named ${team.team_name}.`,
      data: {
        teamId: team.team_id,
        teamName: team.team_name,
        userId: user.user_id,
        userName,
      },
    };
  }
}
