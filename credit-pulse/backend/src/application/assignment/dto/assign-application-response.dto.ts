// This DTO stores a summary of one assignment record.
export class AssignmentSummaryDto {
  // This is the unique ID of the assignment record.
  assignmentId?: string;

  // This is the unique ID of the related application.
  applicationId?: string;

  // This is the application number for reference.
  applicationNumber?: string;

  // This stores the ID of the assigned team, if any.
  assignedTeamId?: string | null;

  // This stores the ID of the assigned user, if any.
  assignedUserId?: string | null;

  // This shows the current status of the assignment.
  assignmentStatus?: string;

  // This stores the date and time when the assignment was made.
  assignedAt?: Date;

  // This stores the date and time when the assignment was removed, if applicable.
  unassignedAt?: Date | null;

  // This stores any optional remarks related to the assignment.
  remarks?: string | null;

  // This shows whether this is the current active assignment.
  isCurrent?: boolean;
}

// This DTO stores the main response data after an assignment action is performed.
export class AssignApplicationResponseDataDto {
  // This is the application number related to the assignment action.
  applicationNumber?: string;

  // This shows what action happened during the assignment process.
  actionPerformed?: 'ASSIGNED' | 'REASSIGNED' | 'NO_CHANGE';

  // This stores the previous assignment details, if available.
  previousAssignment?: AssignmentSummaryDto | null;

  // This stores the current assignment details.
  currentAssignment?: AssignmentSummaryDto;
}

// This DTO defines the full response sent back for the assignment request.
export class AssignApplicationResponseDto {
  // This shows whether the request was successful.
  success?: boolean;

  // This returns the response message.
  message?: string;

  // This contains the main assignment response details.
  data?: AssignApplicationResponseDataDto;
}
