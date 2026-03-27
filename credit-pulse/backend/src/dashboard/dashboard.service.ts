import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { DashboardDto } from './dto/dashboard.dto.js';

/**
 * Type representing a row in the Dashboard table.
 *
 * @property {string} applicationId - The ID of the application.
 * @property {string} applicationNumber - The application number.
 * @property {string | null} customerName - The name of the customer.
 * @property {string | null} type - The type of the application.
 * @property {unknown} principalAmount - The principal amount of the application.
 * @property {number | null} tenure - The tenure of the application.
 * @property {unknown} interestRate - The interest rate of the application.
 * @property {unknown} totalAmount - The total amount of the application.
 * @property {unknown} balance - The balance of the application.
 * @property {unknown} nextPayment - The next payment amount of the application.
 * @property {Date | null} nextPaymentDate - The next payment date of the application.
 * @property {string | null} status - The status of the application.
 * @property {Date} applicationCreationDate - The date the application was created.
 */
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

// Dashboard service class for handling dashboard-related operations such as retrieving applications created by a user.
@Injectable()
export class DashboardService {
  // Constructor for the DashboardService class which injects the PrismaService for database access.
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the applications created by a user.
   *
   * This method retrieves the applications created by a user and returns an array of Dashboard Dto objects.
   * The Dashboard Dto objects contain the application ID, application number, customer name, type, principal amount, tenure, interest rate, total amount, balance, next payment, next payment date, status, and application creation date.
   *
   * @param userId - The ID of the user.
   * @returns An array of Dashboard Dto objects, representing the applications created by the user.
   */
  async getApplicationsCreatedByUser(userId: string): Promise<DashboardDto[]> {
    // Query the database to retrieve the applications created by the user.
    // The query retrieves the following information for each application:
    // - application ID
    // - application number
    // - customer name (concatenated first and last name)
    // - loan type name
    // - principal amount
    // - tenure months
    // - interest rate
    // - total amount (calculated as the sum of the installment amounts)
    // - balance (calculated as the closing balance of the next pending installment)
    // - next payment (calculated as the next pending installment amount)
    // - next payment date (calculated as the due date of the next pending installment)
    // - status (retrieved from the application_status table)
    // - application creation date (retrieved from the loan_application table)
    const rows = await this.prisma.$queryRaw<DashboardApplicationRow[]>`
      SELECT
          la.application_id AS "applicationId",
          la.application_number AS "applicationNumber",
          CONCAT(c.first_name, ' ', c.last_name) AS "customerName",
          lt.loan_type_name AS "type",
          la.requested_amount AS "principalAmount",
          la.tenure_months AS "tenure",
          la.interest_rate AS "interestRate",
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
      WHERE la.created_by = ${userId}
        AND la.is_active = true
      ORDER BY la.created_at DESC
    `;

    // Map the results to an array of Dashboard Dto objects.
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

  /**
   * Converts an unknown value to a number.
   *
   * If the value is null or undefined, returns 0.
   * This is because null and undefined are "falsy" values in JavaScript, so they should be treated as 0 in a numerical context.
   *
   * Otherwise, returns the value converted to a number.
   * This is done using the built-in Number() function, which will attempt to convert the value to a number.
   * If the conversion is successful, the resulting number is returned. If the conversion fails (e.g. because the value is a string that can't be parsed as a number), the resulting value will be NaN (Not a Number).
   */
  private toNumber(value: unknown): number {
    // If the value is null or undefined, return 0.
    if (value === null || value === undefined) {
      return 0;
    }

    // Attempt to convert the value to a number.
    return Number(value);
  }

  /**
   * Converts an unknown value to a number if it can be parsed, otherwise returns null.
   *
   * This function is used to handle cases where a value may be null or undefined, or it may be a string that can't be parsed as a number.
   *
   * If the value is null or undefined, returns null.
   *
   * Otherwise, attempts to convert the value to a number using the built-in Number() function.
   * If the conversion is successful, the resulting number is returned. If the conversion fails (e.g. because the value is a string that can't be parsed as a number), the resulting value will be NaN (Not a Number), and null is returned.
   */
  private toNumberOrNull(value: unknown): number | null {
    // If the value is null or undefined, return null.
    if (value === null || value === undefined) {
      return null;
    }

    // Attempt to convert the value to a number.
    const numberValue = Number(value);

    // If the conversion failed (i.e. the value is NaN), return null.
    if (isNaN(numberValue)) {
      return null;
    }

    // If the conversion succeeded, return the resulting number.
    return numberValue;
  }
}
