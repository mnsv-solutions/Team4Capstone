import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { DashboardDto } from './dto/dashboard.dto.js';

// This type defines the structure of one dashboard row returned from the database query.
type DashboardApplicationRow = {
  applicationId: string;
  applicationNumber: string;
  customerName: string | null;
  type: string | null;
  principalAmount: unknown;
  tenure: number | null;
  interestRate: unknown;
  totalAmount: unknown;
  balance: unknown;
  nextPayment: unknown;
  nextPaymentDate: Date | null;
  status: string | null;
  applicationCreationDate: Date;
};

// This type stores the basic details of the logged-in user.
type DashboardActorContext = {
  userId: string;
  roleCode: string;
  teamId: string | null;
};

// This service handles the main logic for loading dashboard applications.
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // This method gets dashboard applications based on the logged-in user's role.
  async getApplicationsForDashboard(userId: string, roleId: string): Promise<DashboardDto[]> {
    // This gets the user details and role information needed for dashboard filtering.
    const actor = await this.getActorContext(userId, roleId);

    let rows: DashboardApplicationRow[];

    // This loads applications created by the user for customer and sourcing officer roles.
    if (actor.roleCode === 'CUSTOMER' || actor.roleCode === 'SOURCING_OFFICER') {
      rows = await this.fetchCreatedApplications(actor.userId);

      // This loads applications assigned to the user for underwriter and disbursal officer roles.
    } else if (actor.roleCode === 'UNDERWRITER' || actor.roleCode === 'DISBURSAL_OFFICER') {
      rows = await this.fetchAssignedApplications(actor.userId);

      // This blocks unsupported roles from using this dashboard API.
    } else {
      throw new ForbiddenException(
        `Dashboard applications are not supported for role ${actor.roleCode}.`,
      );
    }

    // This converts the query result into the dashboard response format.
    return rows.map((row) => ({
      applicationId: row.applicationId,
      applicationNumber: row.applicationNumber,
      customerName: row.customerName,
      type: row.type,
      principalAmount: this.toNumberOrNull(row.principalAmount),
      tenure: row.tenure,
      interestRate: this.toNumberOrNull(row.interestRate),
      totalAmount: this.toNumber(row.totalAmount),
      balance: this.toNumber(row.balance),
      nextPayment: this.toNumber(row.nextPayment),
      nextPaymentDate: row.nextPaymentDate,
      status: row.status,
      applicationCreationDate: row.applicationCreationDate,
    }));
  }

  // This method finds the logged-in user's details and active role information.
  private async getActorContext(userId: string, roleId: string): Promise<DashboardActorContext> {
    // This checks whether the user exists and is active.
    const user = await this.prisma.users.findFirst({
      where: {
        user_id: userId,
        role_id: roleId,
        is_active: true,
      },
      select: {
        user_id: true,
        role_id: true,
      },
    });

    // This throws an error if the user is not found.
    if (!user) {
      throw new NotFoundException('Authenticated user not found.');
    }

    // This gets the active role of the user.
    const role = await this.prisma.roles.findFirst({
      where: {
        role_id: user.role_id,
        is_active: true,
      },
      select: {
        role_code: true,
      },
    });

    // This throws an error if the role is not found.
    if (!role) {
      throw new NotFoundException('Active role not found for authenticated user.');
    }

    // This finds the user's team membership, if any.
    const teamMember = await this.prisma.team_members.findFirst({
      where: {
        user_id: user.user_id,
        is_active: true,
      },
      select: {
        team_id: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // This returns the user ID, role code, and team ID together.
    return {
      userId: user.user_id,
      roleCode: role.role_code,
      teamId: teamMember?.team_id ?? null,
    };
  }

  // This method gets applications that were created by the logged-in user.
  private async fetchCreatedApplications(userId: string): Promise<DashboardApplicationRow[]> {
    return this.prisma.$queryRaw<DashboardApplicationRow[]>`
      SELECT
          la.application_id AS "applicationId",
          la.application_number AS "applicationNumber",
          CONCAT(c.first_name, ' ', c.last_name) AS "customerName",
          lt.loan_type_name AS "type",
          COALESCE(la.approved_loan_amount, la.requested_amount) AS "principalAmount",
          COALESCE(la.approved_tenure_months, la.tenure_months) AS "tenure",
          COALESCE(la.approved_interest_rate, la.interest_rate) AS "interestRate",
          COALESCE(tot.total_amount, 0) AS "totalAmount",
          COALESCE(nxt.balance, 0) AS "balance",
          COALESCE(nxt.next_payment, 0) AS "nextPayment",
          nxt.next_payment_date AS "nextPaymentDate",
          aps.status_name AS "status",
          la.created_at AS "applicationCreationDate"
      FROM "loan_application" la
      LEFT JOIN "loan_types" lt
          ON lt.loan_type_id = la.loan_type_id
         AND lt.is_active = true
      LEFT JOIN "application_status" aps
          ON aps.status_id = la.status_id
         AND aps.is_active = true
      LEFT JOIN "sub_loan" sl
          ON sl.application_id = la.application_id
         AND sl.applicant_type = 0
         AND sl.is_active = true
      LEFT JOIN "customer" c
          ON c.customer_id = sl.customer_id
         AND c.is_active = true
      LEFT JOIN (
          SELECT
              application_id,
              SUM(installment_amount) AS total_amount
          FROM "repayment_schedule"
          WHERE is_active = true
          GROUP BY application_id
      ) tot
          ON tot.application_id = la.application_id
      LEFT JOIN (
          SELECT DISTINCT ON (application_id)
              application_id,
              installment_amount AS next_payment,
              due_date AS next_payment_date,
              closing_balance AS balance
          FROM "repayment_schedule"
          WHERE is_active = true
            AND payment_status IN ('PENDING', 'PARTIAL', 'OVERDUE')
          ORDER BY application_id, due_date ASC
      ) nxt
          ON nxt.application_id = la.application_id
      WHERE la.created_by = ${userId}::uuid
        AND la.is_active = true
      ORDER BY la.created_at DESC
    `;
  }

  // This method gets applications that are currently assigned to the logged-in user.
  private async fetchAssignedApplications(userId: string): Promise<DashboardApplicationRow[]> {
    return this.prisma.$queryRaw<DashboardApplicationRow[]>`
      SELECT
          la.application_id AS "applicationId",
          la.application_number AS "applicationNumber",
          CONCAT(c.first_name, ' ', c.last_name) AS "customerName",
          lt.loan_type_name AS "type",
          COALESCE(la.approved_loan_amount, la.requested_amount) AS "principalAmount",
          COALESCE(la.approved_tenure_months, la.tenure_months) AS "tenure",
          COALESCE(la.approved_interest_rate, la.interest_rate) AS "interestRate",
          COALESCE(tot.total_amount, 0) AS "totalAmount",
          COALESCE(nxt.balance, 0) AS "balance",
          COALESCE(nxt.next_payment, 0) AS "nextPayment",
          nxt.next_payment_date AS "nextPaymentDate",
          aps.status_name AS "status",
          la.created_at AS "applicationCreationDate"
      FROM "loan_application" la
      INNER JOIN "application_assignment" aa
          ON aa.application_id = la.application_id
         AND aa.is_current = true
         AND aa.is_active = true
      LEFT JOIN "loan_types" lt
          ON lt.loan_type_id = la.loan_type_id
         AND lt.is_active = true
      LEFT JOIN "application_status" aps
          ON aps.status_id = la.status_id
         AND aps.is_active = true
      LEFT JOIN "sub_loan" sl
          ON sl.application_id = la.application_id
         AND sl.applicant_type = 0
         AND sl.is_active = true
      LEFT JOIN "customer" c
          ON c.customer_id = sl.customer_id
         AND c.is_active = true
      LEFT JOIN (
          SELECT
              application_id,
              SUM(installment_amount) AS total_amount
          FROM "repayment_schedule"
          WHERE is_active = true
          GROUP BY application_id
      ) tot
          ON tot.application_id = la.application_id
      LEFT JOIN (
          SELECT DISTINCT ON (application_id)
              application_id,
              installment_amount AS next_payment,
              due_date AS next_payment_date,
              closing_balance AS balance
          FROM "repayment_schedule"
          WHERE is_active = true
            AND payment_status IN ('PENDING', 'PARTIAL', 'OVERDUE')
          ORDER BY application_id, due_date ASC
      ) nxt
          ON nxt.application_id = la.application_id
      WHERE aa.assigned_user_id = ${userId}::uuid
        AND la.is_active = true
      ORDER BY la.created_at DESC
    `;
  }

  // This method converts a value to a number and returns 0 if the value is empty.
  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    return Number(value);
  }

  // This method converts a value to a number and returns null if the value is empty or invalid.
  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numberValue = Number(value);

    if (isNaN(numberValue)) {
      return null;
    }

    return numberValue;
  }
}
