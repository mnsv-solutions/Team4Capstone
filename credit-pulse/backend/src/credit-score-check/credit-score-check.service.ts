import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreditScoreCheckRequestDto } from './dto/credit-score-check-request.dto.js';
import { CreditScoreCheckResponseDto } from './dto/credit-score-check-response.dto.js';

// This type represents a bureau report along with all related master data needed to build the stored snapshot.
type CibilReportWithRelations = Prisma.cibil_reportsGetPayload<{
  include: {
    cibil_applicants: true;
    cibil_accounts: true;
    cibil_payment_history: true;
    cibil_enquiries: true;
    cibil_risk_indicators: true;
  };
}>;

@Injectable()
export class CreditScoreCheckService {
  // Injects Prisma so database queries can be performed here.
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(CreditScoreCheckService.name);

  /**
   * Performs a credit score check based on the provided request.
   *
   * The following steps are taken to perform the credit score check:
   * 1. Validate that customer consent was provided.
   * 2. Find the active application from the incoming application number.
   * 3. Search the CIBIL master tables by customer identity.
   * 4. If a previous credit check exists for the application, mark it as not latest.
   * 5. Save the newly fetched report snapshot into application_credit_check.
   * 6. Update the application status to CREDIT_CHECK_COMPLETED only when a master report is found.
   *
   * @param dto - The request body containing the credit score check request.
   * @param checkedBy - The user who initiated the credit score check.
   * @returns A promise that resolves to the credit score check response.
   */
  async checkCreditScore(
    dto: CreditScoreCheckRequestDto,
    checkedBy: string,
  ): Promise<CreditScoreCheckResponseDto> {
    this.logger.log('The credit score check process has started.');

    // Stop the flow immediately when customer consent is not present.
    if (!dto.consent) {
      this.logger.warn(
        'The credit score check could not continue because consent was not provided.',
      );
      this.logger.warn(
        'The credit score check could not continue because consent was not provided.',
      );
      throw new BadRequestException('Consent is required to perform credit score check');
    }

    this.logger.log('Consent was received for the credit score check request.');

    // Find the active loan application for the given application number.
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: dto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
        status_id: true,
      },
    });

    // Stop the request when no active application exists.
    if (!application) {
      this.logger.warn(
        `No active application was found for application number: ${dto.applicationNumber}`,
      );
      this.logger.warn(
        `No active application was found for application number: ${dto.applicationNumber}`,
      );
      throw new NotFoundException('Application not found');
    }

    this.logger.log(`The application was found for application number: ${dto.applicationNumber}`);

    // Normalize identity values before matching with the bureau master data.
    const normalizedSin = dto.sin.trim();
    const normalizedFirstName = dto.firstName.trim();
    const normalizedLastName = dto.lastName.trim();
    const normalizedDateOfBirth = new Date(dto.dateOfBirth);

    this.logger.log('The applicant details were normalized for bureau matching.');

    // Search the CIBIL master tables by customer identity.
    // This no longer depends on cibil_reports.application_id, which was the main issue.
    const cibilReport = (await this.prisma.cibil_reports.findFirst({
      where: {
        cibil_applicants: {
          is: {
            sin_number: normalizedSin,
            date_of_birth: normalizedDateOfBirth,
            first_name: {
              equals: normalizedFirstName,
              mode: 'insensitive',
            },
            last_name: {
              equals: normalizedLastName,
              mode: 'insensitive',
            },
          },
        },
      },
      orderBy: {
        report_date: 'desc',
      },
      include: {
        cibil_applicants: true,
        cibil_accounts: {
          orderBy: {
            open_date: 'asc',
          },
        },
        cibil_payment_history: {
          orderBy: {
            month_index: 'asc',
          },
        },
        cibil_enquiries: {
          orderBy: {
            enquiry_date: 'desc',
          },
        },
        cibil_risk_indicators: true,
      },
    })) as CibilReportWithRelations | null;

    this.logger.log('The bureau report lookup was completed.');

    this.logger.log('The bureau master lookup was completed.');

    // Keep the existing endpoint behavior by storing a NOT_FOUND snapshot when no master report matches.
    // This still deactivates the previous latest record so the newest attempt remains visible.
    if (!cibilReport) {
      this.logger.warn('No matching bureau report was found for the provided applicant details.');

      const notFoundCheck = await this.prisma.$transaction(async (tx) => {
        this.logger.log('The NOT_FOUND credit score transaction has started.');

        await tx.application_credit_check.updateMany({
          where: {
            application_id: application.application_id,
            is_latest: true,
          },
          data: {
            is_latest: false,
          },
        });

        this.logger.log('Any previous latest credit check records were cleared.');

        return tx.application_credit_check.create({
          data: {
            application_id: application.application_id,
            bureau_name: 'CIBIL',
            bureau_status: 'NOT_FOUND',
            checked_by: checkedBy,
            remarks: 'No matching CIBIL record found in master tables',
            raw_response: Prisma.JsonNull,
            is_latest: true,
          },
        });
      });

      this.logger.log('A not found credit check record was created successfully.');

      return notFoundCheck as CreditScoreCheckResponseDto;
    }

    this.logger.log('A matching bureau report was found successfully.');

    // Build the raw snapshot that will be stored in application_credit_check.
    const rawResponse = this.buildRawResponse(cibilReport);

    this.logger.log('The raw bureau response was prepared successfully.');

    // Fetch the status that should be applied after a successful credit check.
    const status = await this.prisma.application_status.findFirst({
      where: {
        status_code: 'CREDIT_CHECK_COMPLETED',
        is_active: true,
      },
      select: {
        status_id: true,
      },
    });

    if (!status) {
      this.logger.warn(
        'The target application status for completed credit check could not be found.',
      );
      this.logger.warn(
        'The target application status for completed credit check could not be found.',
      );
      throw new NotFoundException('Application status CREDIT_CHECK_COMPLETED not found');
    }

    this.logger.log('The target application status was found successfully.');

    // Store the new application credit check snapshot and update the application in one transaction.
    const createdCheck = await this.prisma.$transaction(async (tx) => {
      this.logger.log('The credit score check transaction has started.');

      await tx.application_credit_check.updateMany({
        where: {
          application_id: application.application_id,
          is_latest: true,
        },
        data: {
          is_latest: false,
        },
      });

      this.logger.log('Any previous latest credit check records were cleared.');

      const creditCheck = await tx.application_credit_check.create({
        data: {
          application_id: application.application_id,
          cibil_report_id: cibilReport.cibil_report_id,
          request_id: cibilReport.request_id,
          bureau_name: cibilReport.bureau,
          bureau_reference_id: cibilReport.reference_id,
          bureau_status: cibilReport.status,
          credit_score: cibilReport.cibil_score,
          score_band: cibilReport.score_band,
          risk_level: cibilReport.risk_level,
          checked_by: checkedBy,
          remarks: 'Credit score fetched successfully from CIBIL master tables',
          raw_response: rawResponse,
          is_latest: true,
        },
      });

      this.logger.log('The credit check record was created successfully.');

      await tx.loan_application.update({
        where: {
          application_id: application.application_id,
        },
        data: {
          status_id: status.status_id,
          updated_by: checkedBy,
        },
      });

      this.logger.log('The application status was updated after the credit check.');

      this.logger.log('The application status was updated after the credit check.');

      return creditCheck;
    });

    this.logger.log(
      `Credit score check completed successfully for application with ID: ${application.application_id}`,
    );

    return createdCheck as CreditScoreCheckResponseDto;
  }

  /**
   * Builds the JSON payload that will be stored as raw bureau response.
   *
   * @param cibilReport - The CIBIL report with related master data.
   * @returns A Prisma.InputJsonObject representing the converted JSON structure.
   */
  private buildRawResponse(cibilReport: CibilReportWithRelations): Prisma.InputJsonObject {
    this.logger.log('The bureau response is being converted into the stored JSON format.');

    const applicant = cibilReport.cibil_applicants;
    const riskIndicators = cibilReport.cibil_risk_indicators;

    return {
      header: {
        requestId: cibilReport.request_id,
        referenceId: cibilReport.reference_id,
        bureau: cibilReport.bureau,
        reportDate: cibilReport.report_date.toISOString(),
        status: cibilReport.status,
      },
      applicant: {
        firstName: applicant?.first_name ?? null,
        lastName: applicant?.last_name ?? null,
        dateOfBirth: applicant ? this.toDateOnly(applicant.date_of_birth) : null,
        sin: applicant?.sin_number ?? null,
        mobileNumber: applicant?.mobile_number ?? null,
      },
      score: {
        cibilScore: cibilReport.cibil_score,
        scoreBand: cibilReport.score_band,
        riskLevel: cibilReport.risk_level,
        scoreVersion: cibilReport.score_version,
      },
      summary: {
        totalAccounts: cibilReport.total_accounts,
        activeAccounts: cibilReport.active_accounts,
        closedAccounts: cibilReport.closed_accounts,
        totalOutstandingBalance: this.toNumber(cibilReport.total_outstanding_balance),
        securedLoanAccounts: cibilReport.secured_loan_accounts,
        unsecuredLoanAccounts: cibilReport.unsecured_loan_accounts,
      },
      accounts: cibilReport.cibil_accounts.map((account) => ({
        accountType: account.account_type,
        lenderName: account.lender_name,
        accountNumberMasked: account.account_number_masked,
        ownershipType: account.ownership_type,
        openDate: this.toDateOnly(account.open_date),
        currentBalance: this.toNumber(account.current_balance),
        creditLimit: this.toNullableNumber(account.credit_limit),
        paymentStatus: account.payment_status,
        daysPastDue: account.days_past_due,
      })),
      paymentHistory: {
        last12Months: cibilReport.cibil_payment_history.map((history) => history.status_code),
        totalMissedPayments: cibilReport.total_missed_payments,
        recentDelinquency: cibilReport.recent_delinquency,
      },
      enquiries: cibilReport.cibil_enquiries.map((enquiry) => ({
        date: this.toDateOnly(enquiry.enquiry_date),
        institution: enquiry.institution,
        type: enquiry.enquiry_type,
      })),
      riskIndicators: {
        highCreditUtilization: riskIndicators?.high_credit_utilization ?? false,
        recentHardEnquiries: riskIndicators?.recent_hard_enquiries ?? false,
        thinFile: riskIndicators?.thin_file ?? false,
        creditMixHealthy: riskIndicators?.credit_mix_healthy ?? false,
      },
      derivedMetrics: {
        creditUtilizationRatio: this.toNumber(cibilReport.credit_utilization_ratio),
        averageAccountAgeYears: this.toNumber(cibilReport.average_account_age_years),
        debtToIncomeEstimate: this.toNumber(cibilReport.debt_to_income_estimate),
      },
    } satisfies Prisma.InputJsonObject;
  }

  /**
   * Converts the given value into a number, returning 0 when the value is missing or invalid.
   */
  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
      return 0;
    }

    return parsedValue;
  }

  /**
   * Converts the given value into a number, returning null when the value is missing or invalid.
   */
  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
      return null;
    }

    return parsedValue;
  }

  /**
   * Returns a date string in YYYY-MM-DD format.
   */
  private toDateOnly(value: Date): string {
    if (value === null || value === undefined) {
      return '';
    }

    const splitString = value.toISOString().split('T');
    return splitString[0] ?? '';
  }
}
