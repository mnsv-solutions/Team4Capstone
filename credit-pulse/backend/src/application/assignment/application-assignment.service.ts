import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { AssignApplicationRequestDto } from './dto/assign-application-request.dto.js';
import {
  AssignApplicationResponseDto,
  AssignmentSummaryDto,
} from './dto/assign-application-response.dto.js';

// This service handles the main logic for assigning and reassigning applications.
@Injectable()
export class AssignApplicationService {
  private readonly logger = new Logger(AssignApplicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // This method assigns the application to a team or user after all checks are passed.
  async assign(
    dto: AssignApplicationRequestDto,
    authenticatedUserId: string,
  ): Promise<AssignApplicationResponseDto> {
    this.logger.log('The application assignment process has started.');

    // This gets the main values from the request body.
    const { applicationNumber, assignedTeamId, assignedUserId, remarks } = dto;

    this.logger.log(`The request is being checked for application number: ${applicationNumber}`);

    // This makes sure at least a team ID or user ID is provided.
    if (!assignedTeamId && !assignedUserId) {
      this.logger.warn(
        'The assignment request could not continue because no team or user was provided.',
      );
      throw new BadRequestException('Either assignedTeamId or assignedUserId must be provided.');
    }

    // This checks whether the logged-in user exists and is active.
    const authenticatedUser = await this.prisma.users.findFirst({
      where: {
        user_id: authenticatedUserId,
        is_active: true,
      },
      select: {
        user_id: true,
      },
    });

    // This stops the process if the logged-in user is not found.
    if (!authenticatedUser) {
      this.logger.warn(
        'The assignment request could not continue because the authenticated user was not found.',
      );
      throw new NotFoundException('Authenticated user not found.');
    }

    this.logger.log('The authenticated user was verified successfully.');

    // This finds the application using the application number.
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
      },
    });

    // This throws an error if the application does not exist.
    if (!application) {
      this.logger.warn(
        `No active application was found for application number: ${applicationNumber}`,
      );
      throw new NotFoundException('Application not found.');
    }

    this.logger.log(
      `The application record was found for application number: ${applicationNumber}`,
    );

    // This keeps the selected team ID and updates it later if needed.
    let resolvedTeamId = assignedTeamId ?? null;

    // This checks whether the selected team exists and is active.
    if (assignedTeamId) {
      this.logger.log(`The selected team is being verified for team ID: ${assignedTeamId}`);

      const team = await this.prisma.teams.findFirst({
        where: {
          team_id: assignedTeamId,
          is_active: true,
        },
        select: {
          team_id: true,
        },
      });

      // This throws an error if the selected team is not found.
      if (!team) {
        this.logger.warn(`The selected team could not be found for team ID: ${assignedTeamId}`);
        throw new NotFoundException('Assigned team not found.');
      }

      this.logger.log(`The selected team was verified successfully for team ID: ${assignedTeamId}`);
    }

    // This checks whether the selected user exists and is active.
    if (assignedUserId) {
      this.logger.log(`The selected user is being verified for user ID: ${assignedUserId}`);

      const assignedUser = await this.prisma.users.findFirst({
        where: {
          user_id: assignedUserId,
          is_active: true,
        },
        select: {
          user_id: true,
        },
      });

      // This throws an error if the selected user is not found.
      if (!assignedUser) {
        this.logger.warn(`The selected user could not be found for user ID: ${assignedUserId}`);
        throw new NotFoundException('Assigned user not found.');
      }

      this.logger.log(`The selected user was verified successfully for user ID: ${assignedUserId}`);

      // This checks whether the selected user belongs to the selected team.
      if (resolvedTeamId) {
        this.logger.log('The selected user and team relationship is being verified.');

        const membership = await this.prisma.team_members.findFirst({
          where: {
            user_id: assignedUserId,
            team_id: resolvedTeamId,
            is_active: true,
          },
          select: {
            team_member_id: true,
          },
        });

        // This stops the process if the user is not part of that team.
        if (!membership) {
          this.logger.warn('The selected user does not belong to the specified team.');
          throw new ForbiddenException('Assigned user does not belong to the specified team.');
        }

        this.logger.log('The selected user belongs to the specified team.');
      } else {
        this.logger.log('No team was provided, so the user team is being resolved automatically.');

        // This finds the first active team of the selected user if no team was given.
        const membership = await this.prisma.team_members.findFirst({
          where: {
            user_id: assignedUserId,
            is_active: true,
          },
          orderBy: {
            created_at: 'asc',
          },
          select: {
            team_id: true,
          },
        });

        // This throws an error if the user does not belong to any active team.
        if (!membership) {
          this.logger.warn('The selected user does not belong to any active team.');
          throw new ForbiddenException('Assigned user does not belong to any active team.');
        }

        // This automatically uses the user's team as the assigned team.
        resolvedTeamId = membership.team_id;

        this.logger.log(`The team was resolved automatically for user ID: ${assignedUserId}`);
      }
    }

    // This gets the current active assignment for the application, if one exists.
    const currentAssignment = await this.prisma.application_assignment.findFirst({
      where: {
        application_id: application.application_id,
        is_current: true,
        is_active: true,
      },
      orderBy: {
        assigned_at: 'desc',
      },
    });

    this.logger.log('The current assignment status was checked successfully.');

    // This checks whether the new assignment is exactly the same as the current one.
    const isSameAssignment =
      currentAssignment &&
      currentAssignment.assigned_team_id === resolvedTeamId &&
      currentAssignment.assigned_user_id === (assignedUserId ?? null);

    // This returns a success response without changes if the assignment is already the same.
    if (isSameAssignment) {
      this.logger.log(
        'No change was needed because the application is already assigned to the same target.',
      );

      return {
        success: true,
        message: 'Application is already assigned to the same target.',
        data: {
          applicationNumber: application.application_number,
          actionPerformed: 'NO_CHANGE',
          previousAssignment: null,
          currentAssignment: this.mapAssignment(
            currentAssignment,
            application.application_id,
            application.application_number,
          ),
        },
      };
    }

    this.logger.log(
      'The assignment details are valid, and the assignment update is now being processed.',
    );

    // This transaction closes the old assignment and creates the new one together.
    const result = await this.prisma.$transaction(async (tx) => {
      let previousAssignment: AssignmentSummaryDto | null = null;

      // This closes the current assignment before creating a new one.
      if (currentAssignment) {
        this.logger.log('The existing assignment is being closed before creating the new one.');

        const closedAssignment = await tx.application_assignment.update({
          where: {
            assignment_id: currentAssignment.assignment_id,
          },
          data: {
            assignment_status: 'COMPLETED',
            is_current: false,
            unassigned_at: new Date(),
            unassigned_by: authenticatedUserId,
            updated_by: authenticatedUserId,
          },
        });

        // This prepares the previous assignment data for the response.
        previousAssignment = this.mapAssignment(
          closedAssignment,
          application.application_id,
          application.application_number,
        );
      }

      // This creates the new active assignment record.
      const newAssignment = await tx.application_assignment.create({
        data: {
          application_id: application.application_id,
          assigned_team_id: resolvedTeamId,
          assigned_user_id: assignedUserId ?? null,
          assignment_status: 'ACTIVE',
          assigned_at: new Date(),
          assigned_by: authenticatedUserId,
          remarks: remarks ?? null,
          is_current: true,
          is_active: true,
          created_by: authenticatedUserId,
          updated_by: authenticatedUserId,
        },
      });

      this.logger.log('The new assignment record was created successfully.');

      // This returns both previous and current assignment details.
      return {
        previousAssignment,
        currentAssignment: this.mapAssignment(
          newAssignment,
          application.application_id,
          application.application_number,
        ),
      };
    });

    this.logger.log('The application assignment process was completed successfully.');

    // This returns the final response after assignment or reassignment is completed.
    return {
      success: true,
      message: currentAssignment
        ? 'Application reassigned successfully.'
        : 'Application assigned successfully.',
      data: {
        applicationNumber: application.application_number,
        actionPerformed: currentAssignment ? 'REASSIGNED' : 'ASSIGNED',
        previousAssignment: result.previousAssignment,
        currentAssignment: result.currentAssignment,
      },
    };
  }

  // This method converts the database assignment record into the response format.
  private mapAssignment(
    assignment: {
      assignment_id: string;
      assigned_team_id: string | null;
      assigned_user_id: string | null;
      assignment_status: string;
      assigned_at: Date;
      unassigned_at: Date | null;
      remarks: string | null;
      is_current: boolean;
    },
    applicationId: string,
    applicationNumber: string,
  ): AssignmentSummaryDto {
    this.logger.log('The assignment details are being prepared for the response.');

    // This returns a cleaner assignment object for the API response.
    return {
      assignmentId: assignment.assignment_id,
      applicationId,
      applicationNumber,
      assignedTeamId: assignment.assigned_team_id,
      assignedUserId: assignment.assigned_user_id,
      assignmentStatus: assignment.assignment_status,
      assignedAt: assignment.assigned_at,
      unassignedAt: assignment.unassigned_at,
      remarks: assignment.remarks,
      isCurrent: assignment.is_current,
    };
  }
}
