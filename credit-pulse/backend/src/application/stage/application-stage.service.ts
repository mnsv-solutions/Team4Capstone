import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FetchStageHistoryRequestDto } from './dto/fetch-stage-history-request.dto.js';
import { FetchStageHistoryResponseDto } from './dto/fetch-stage-history-response.dto.js';
import { PushStageRequestDto, StageActionType } from './dto/push-stage-request.dto.js';
import { PushStageResponseDto } from './dto/push-stage-response.dto.js';

// This type stores the basic details of the logged-in user who is performing the action.
type ActorContext = {
  userId: string;
  roleCode: string;
};

// This type defines which roles can perform an action and how the status should move.
type StageConfig = {
  allowedRoles: string[];
  fromStatuses: string[];
  toStatus: string;
  decisionCode?: 'APPROVE' | 'REJECT' | 'REFER';
};

// This object defines the rules for each stage action in the application flow.
const STAGE_CONFIG: Record<StageActionType, StageConfig> = {
  SUBMITTED: {
    allowedRoles: ['SOURCING_OFFICER'],
    fromStatuses: ['CREATED'],
    toStatus: 'SUBMITTED',
  },
  CREDIT_CHECK_COMPLETED: {
    allowedRoles: ['SOURCING_OFFICER'],
    fromStatuses: ['SUBMITTED'],
    toStatus: 'CREDIT_CHECK_COMPLETED',
  },
  UNDER_REVIEW: {
    allowedRoles: ['SOURCING_OFFICER'],
    fromStatuses: ['CREDIT_CHECK_COMPLETED'],
    toStatus: 'UNDER_REVIEW',
  },
  UNDERWRITER_APPROVED: {
    allowedRoles: ['UNDERWRITER'],
    fromStatuses: ['UNDER_REVIEW'],
    toStatus: 'APPROVED',
    decisionCode: 'APPROVE',
  },
  UNDERWRITER_REJECTED: {
    allowedRoles: ['UNDERWRITER'],
    fromStatuses: ['UNDER_REVIEW'],
    toStatus: 'REJECTED',
    decisionCode: 'REJECT',
  },
  UNDERWRITER_REFERRED: {
    allowedRoles: ['UNDERWRITER'],
    fromStatuses: ['UNDER_REVIEW'],
    toStatus: 'UNDER_REVIEW',
    decisionCode: 'REFER',
  },
  DISBURSAL_COMPLETED: {
    allowedRoles: ['DISBURSAL_OFFICER'],
    fromStatuses: ['APPROVED'],
    toStatus: 'DISBURSED',
  },
  DISBURSAL_REJECTED: {
    allowedRoles: ['DISBURSAL_OFFICER'],
    fromStatuses: ['APPROVED'],
    toStatus: 'APPROVED',
  },
};

@Injectable()
export class ApplicationStageService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(ApplicationStageService.name);

  // This method validates the request, updates the application stage, and saves the action history.
  async pushStage(
    actorUserId: string,
    pushStageRequestDto: PushStageRequestDto,
  ): Promise<PushStageResponseDto> {
    // This makes sure the user ID is available from the token.
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found in token.');
    }

    // This gets the logged-in user's role and other basic details.
    const actor = await this.getActorContext(actorUserId);

    // This loads the stage rules for the selected action type.
    const stageConfig = STAGE_CONFIG[pushStageRequestDto.actionType];

    // This checks whether the given action type is supported.
    if (!stageConfig) {
      throw new BadRequestException('Unsupported stage action type.');
    }

    // This checks whether the current user role is allowed to perform this action.
    if (!stageConfig.allowedRoles.includes(actor.roleCode)) {
      throw new ForbiddenException(
        `Users with role ${actor.roleCode} cannot perform action ${pushStageRequestDto.actionType}.`,
      );
    }

    // This validates the extra fields required for some specific stage actions.
    this.validatePayloadForStage(pushStageRequestDto);

    // This transaction updates both the application record and its stage history together.
    return this.prisma.$transaction(async (tx) => {
      // This finds the application using the application number.
      const application = await tx.loan_application.findFirst({
        where: {
          application_number: pushStageRequestDto.applicationNumber,
          is_active: true,
        },
        select: {
          application_id: true,
          application_number: true,
          status_id: true,
          approved_loan_amount: true,
          application_status: {
            select: {
              status_code: true,
            },
          },
        },
      });

      // This stops the process if the application does not exist.
      if (!application) {
        throw new NotFoundException('Application not found.');
      }

      // This checks whether the action is allowed from the application's current status.
      if (!stageConfig.fromStatuses.includes(application.application_status.status_code)) {
        throw new BadRequestException(
          `Action ${pushStageRequestDto.actionType} is not allowed when application is in ${application.application_status.status_code} status.`,
        );
      }

      // This finds the target status that the application should move to.
      const toStatus = await tx.application_status.findFirst({
        where: {
          status_code: stageConfig.toStatus,
          is_active: true,
        },
        select: {
          status_id: true,
          status_code: true,
        },
      });

      // This throws an error if the target status is missing in the database.
      if (!toStatus) {
        throw new NotFoundException(`Target status ${stageConfig.toStatus} not found.`);
      }

      let decisionTypeId: string | null = null;
      let decisionTypeCode: string | null = null;

      // This loads the matching decision type when the action needs one.
      if (stageConfig.decisionCode) {
        const decisionType = await tx.decision_types.findFirst({
          where: {
            decision_code: stageConfig.decisionCode,
            is_active: true,
          },
          select: {
            decision_type_id: true,
            decision_code: true,
          },
        });

        // This throws an error if the required decision type is not found.
        if (!decisionType) {
          throw new NotFoundException(`Decision type ${stageConfig.decisionCode} not found.`);
        }

        decisionTypeId = decisionType.decision_type_id;
        decisionTypeCode = decisionType.decision_code;
      }

      // This makes sure the disbursed amount does not go above the approved loan amount.
      if (
        pushStageRequestDto.actionType === 'DISBURSAL_COMPLETED' &&
        application.approved_loan_amount &&
        pushStageRequestDto.disbursedAmount &&
        Number(pushStageRequestDto.disbursedAmount) > Number(application.approved_loan_amount)
      ) {
        throw new BadRequestException(
          'Disbursed amount cannot be greater than approved loan amount.',
        );
      }

      // This prepares the fields that need to be updated in the loan application table.
      const updatePayload: Record<string, unknown> = {
        status_id: toStatus.status_id,
        updated_by: actor.userId,
        updated_at: new Date(),
      };

      // This saves approval details when the underwriter approves the application.
      if (pushStageRequestDto.actionType === 'UNDERWRITER_APPROVED') {
        updatePayload.approved_loan_amount = pushStageRequestDto.approvedLoanAmount;
        updatePayload.approved_interest_rate = pushStageRequestDto.approvedInterestRate;
        updatePayload.approved_tenure_months = pushStageRequestDto.approvedTenureMonths;
        updatePayload.approved_emi = pushStageRequestDto.approvedEmi;
      }

      // This updates the current application record with the new status and values.
      await tx.loan_application.update({
        where: { application_id: application.application_id },
        data: updatePayload,
      });

      // This creates a history record for the stage action that was performed.
      const historyRecord = await tx.application_action_history.create({
        data: {
          application_id: application.application_id,
          action_type: pushStageRequestDto.actionType,
          from_status_id: application.status_id,
          to_status_id: toStatus.status_id,
          performed_by_user_id: actor.userId,
          performed_at: new Date(),
          performer_role_code: actor.roleCode,
          decision_type_id: decisionTypeId,
          remarks: pushStageRequestDto.remarks ?? null,
          approved_loan_amount:
            pushStageRequestDto.actionType === 'UNDERWRITER_APPROVED'
              ? (pushStageRequestDto.approvedLoanAmount ?? null)
              : null,
          approved_interest_rate:
            pushStageRequestDto.actionType === 'UNDERWRITER_APPROVED'
              ? (pushStageRequestDto.approvedInterestRate ?? null)
              : null,
          approved_tenure_months:
            pushStageRequestDto.actionType === 'UNDERWRITER_APPROVED'
              ? (pushStageRequestDto.approvedTenureMonths ?? null)
              : null,
          approved_emi:
            pushStageRequestDto.actionType === 'UNDERWRITER_APPROVED'
              ? (pushStageRequestDto.approvedEmi ?? null)
              : null,
          disbursed_amount:
            pushStageRequestDto.actionType === 'DISBURSAL_COMPLETED'
              ? (pushStageRequestDto.disbursedAmount ?? null)
              : null,
          metadata_json:
            pushStageRequestDto.metadataJson !== undefined
              ? (pushStageRequestDto.metadataJson as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          created_by: actor.userId,
          updated_by: actor.userId,
          is_active: true,
        },
      });

      this.logger.log(
        `Application of type ${pushStageRequestDto.actionType} pushed successfully for application with ID: ${application.application_id}`,
      );

      // This returns the saved stage details in the response.
      return {
        message: 'Application stage pushed successfully.',
        data: {
          actionHistoryId: historyRecord.action_history_id,
          applicationId: application.application_id,
          applicationNumber: application.application_number,
          actionType: pushStageRequestDto.actionType,
          previousStatus: application.application_status.status_code,
          currentStatus: toStatus.status_code,
          performedByUserId: actor.userId,
          performerRoleCode: actor.roleCode,
          performedAt: historyRecord.performed_at,
          decisionTypeCode,
          remarks: historyRecord.remarks,
          approvedLoanAmount: this.toNumber(historyRecord.approved_loan_amount),
          approvedInterestRate: this.toNumber(historyRecord.approved_interest_rate),
          approvedTenureMonths: historyRecord.approved_tenure_months,
          approvedEmi: this.toNumber(historyRecord.approved_emi),
          disbursedAmount: this.toNumber(historyRecord.disbursed_amount),
          metadataJson: this.toObject(historyRecord.metadata_json),
        },
      };
    });
  }

  // This method gets the full stage history for the given application.
  async fetchStageHistory(
    fetchStageHistoryRequestDto: FetchStageHistoryRequestDto,
  ): Promise<FetchStageHistoryResponseDto> {
    // This finds the application first using the application number.
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: fetchStageHistoryRequestDto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
      },
    });

    // This throws an error if the application does not exist.
    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    // This loads all active stage history records for the application.
    const historyRows = await this.prisma.application_action_history.findMany({
      where: {
        application_id: application.application_id,
        is_active: true,
      },
      orderBy: {
        performed_at: fetchStageHistoryRequestDto.sortOrder ?? 'asc',
      },
      include: {
        from_status: {
          select: {
            status_code: true,
          },
        },
        to_status: {
          select: {
            status_code: true,
          },
        },
        decision_type: {
          select: {
            decision_code: true,
          },
        },
      },
    });

    // This returns the stage history in the required response format.
    return {
      message: 'Application stage history fetched successfully.',
      data: historyRows.map((historyRow) => ({
        actionHistoryId: historyRow.action_history_id,
        applicationId: historyRow.application_id,
        applicationNumber: application.application_number,
        actionType: historyRow.action_type,
        fromStatusCode: historyRow.from_status?.status_code ?? null,
        toStatusCode: historyRow.to_status.status_code,
        performedByUserId: historyRow.performed_by_user_id,
        performedAt: historyRow.performed_at,
        performerRoleCode: historyRow.performer_role_code,
        decisionTypeCode: historyRow.decision_type?.decision_code ?? null,
        remarks: historyRow.remarks,
        approvedLoanAmount: this.toNumber(historyRow.approved_loan_amount),
        approvedInterestRate: this.toNumber(historyRow.approved_interest_rate),
        approvedTenureMonths: historyRow.approved_tenure_months,
        approvedEmi: this.toNumber(historyRow.approved_emi),
        disbursedAmount: this.toNumber(historyRow.disbursed_amount),
        metadataJson: this.toObject(historyRow.metadata_json),
        createdAt: historyRow.created_at,
        createdBy: historyRow.created_by,
        updatedAt: historyRow.updated_at ?? null,
        updatedBy: historyRow.updated_by ?? null,
        isActive: historyRow.is_active,
      })),
    };
  }

  // This method gets the logged-in user's ID and role from the database.
  private async getActorContext(actorUserId: string): Promise<ActorContext> {
    // This finds the active and unblocked user.
    const user = await this.prisma.users.findFirst({
      where: {
        user_id: actorUserId,
        is_active: true,
        is_blocked: false,
      },
      select: {
        user_id: true,
        role_id: true,
      },
    });

    // This stops the action if the user is not allowed.
    if (!user) {
      throw new UnauthorizedException('Authenticated user is not allowed to perform this action.');
    }

    // This finds the user's active role.
    const role = await this.prisma.roles.findFirst({
      where: {
        role_id: user.role_id,
        is_active: true,
      },
      select: {
        role_code: true,
      },
    });

    // This throws an error if the role is missing.
    if (!role) {
      throw new UnauthorizedException('Role not found for authenticated user.');
    }

    // This returns the user ID and role code together.
    return {
      userId: user.user_id,
      roleCode: role.role_code,
    };
  }

  // This method checks whether the required fields are present for specific actions.
  private validatePayloadForStage(pushStageRequestDto: PushStageRequestDto): void {
    // This makes sure approval details are provided for approval action.
    if (pushStageRequestDto.actionType === 'UNDERWRITER_APPROVED') {
      if (
        pushStageRequestDto.approvedLoanAmount === undefined ||
        pushStageRequestDto.approvedInterestRate === undefined ||
        pushStageRequestDto.approvedTenureMonths === undefined ||
        pushStageRequestDto.approvedEmi === undefined
      ) {
        throw new BadRequestException(
          'Approved loan amount, approved interest rate, approved tenure months, and approved EMI are required for UNDERWRITER_APPROVED action.',
        );
      }
    }

    // This makes sure disbursed amount is provided for disbursal completion.
    if (
      pushStageRequestDto.actionType === 'DISBURSAL_COMPLETED' &&
      pushStageRequestDto.disbursedAmount === undefined
    ) {
      throw new BadRequestException('Disbursed amount is required for DISBURSAL_COMPLETED action.');
    }
  }

  // This method converts a value into a number and returns null when the value is empty.
  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }

  // This method safely converts JSON data into an object when possible.
  private toObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }
}
