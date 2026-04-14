import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { TeamDashboardDto } from './dto/fetch-team-applications-response.dto.js';

// This type is used to define the shape of each row returned from the raw SQL query.
type TeamDashboardRow = {
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
  assignedTo: string | null;
};

// This service handles the logic for fetching applications assigned to a team.
@Injectable()
export class FetchTeamApplicationsService {
  private readonly logger = new Logger(FetchTeamApplicationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // This method gets all applications assigned to a team, with an optional status filter.
  async fetchApplicationsByTeam(
    teamId: string,
    statusCode?: string | null,
  ): Promise<TeamDashboardDto[]> {
    this.logger.log(`The team application fetch process has started for team ID: ${teamId}`);

    // This raw query fetches dashboard details for all applications assigned to the given team.
    const rows = await this.prisma.$queryRaw<TeamDashboardRow[]>`
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
          la.created_at AS "applicationCreationDate",
          CASE
            WHEN aa.assigned_user_id IS NULL THEN NULL
            ELSE CONCAT(au.first_name, ' ', au.last_name)
          END AS "assignedTo"
      FROM "loan_application" la
      INNER JOIN "application_assignment" aa
          ON aa.application_id = la.application_id
         AND aa.assigned_team_id = ${teamId}::uuid
         AND aa.is_current = true
         AND aa.is_active = true
      LEFT JOIN "users" au
          ON au.user_id = aa.assigned_user_id
         AND au.is_active = true
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
      WHERE la.is_active = true
        AND (${statusCode ?? null}::text IS NULL OR aps.status_code = ${statusCode ?? null})
      ORDER BY la.created_at DESC
    `;

    this.logger.log(
      `The team applications were fetched successfully. Total records found: ${rows.length}`,
    );

    // This converts the query result into the response format expected by the DTO.
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
      assignedTo: row.assignedTo,
    }));
  }

  // This method converts a value to a number and returns 0 if the value is empty.
  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    return Number(value);
  }

  // This method converts a value to a number and returns null if the value is invalid.
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
