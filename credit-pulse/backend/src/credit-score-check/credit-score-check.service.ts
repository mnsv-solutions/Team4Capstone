import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreditScoreCheckRequestDto } from './dto/credit-score-check-request.dto.js';
import { CreditScoreCheckResponseDto } from './dto/credit-score-check-response.dto.js';

type CibilReportWithRelations = {
  cibil_report_id: string;
  application_id: string;
  request_id: string;
  reference_id: string;
  bureau: string;
  report_date: Date;
  status: string;
  cibil_score: number;
  score_band: string;
  risk_level: string;
  score_version: string;
  total_accounts: number;
  active_accounts: number;
  closed_accounts: number;
  total_outstanding_balance: unknown;
  secured_loan_accounts: number;
  unsecured_loan_accounts: number;
  total_missed_payments: number;
  recent_delinquency: boolean;
  credit_utilization_ratio: unknown;
  average_account_age_years: unknown;
  debt_to_income_estimate: unknown;
  cibil_applicants: {
    first_name: string;
    last_name: string;
    date_of_birth: Date;
    sin_number: string;
    mobile_number: string;
  } | null;
  cibil_accounts: Array<{
    account_type: string;
    lender_name: string;
    account_number_masked: string;
    ownership_type: string;
    open_date: Date;
    current_balance: unknown;
    credit_limit: unknown | null;
    payment_status: string;
    days_past_due: number;
  }>;
  cibil_payment_history: Array<{
    month_index: number;
    status_code: string;
  }>;
  cibil_enquiries: Array<{
    enquiry_date: Date;
    institution: string;
    enquiry_type: string;
  }>;
  cibil_risk_indicators: {
    high_credit_utilization: boolean;
    recent_hard_enquiries: boolean;
    thin_file: boolean;
    credit_mix_healthy: boolean;
  } | null;
};

@Injectable()
export class CreditScoreCheckService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(CreditScoreCheckService.name);

  async checkCreditScore(
    dto: CreditScoreCheckRequestDto,
    checkedBy: string,
  ): Promise<CreditScoreCheckResponseDto> {
    this.logger.log('The credit score check process has started.');

    if (!dto.consent) {
      this.logger.warn(
        'The credit score check could not continue because consent was not provided.',
      );
      throw new BadRequestException('Consent is required to perform credit score check');
    }

    this.logger.log('Consent was received for the credit score check request.');

    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: dto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
      },
    });

    if (!application) {
      this.logger.warn(
        `No active application was found for application number: ${dto.applicationNumber}`,
      );
      throw new NotFoundException('Application not found');
    }

    this.logger.log(`The application was found for application number: ${dto.applicationNumber}`);

    const normalizedSin = dto.sin.trim();
    const normalizedFirstName = dto.firstName.trim();
    const normalizedLastName = dto.lastName.trim();
    const normalizedDateOfBirth = new Date(dto.dateOfBirth);

    this.logger.log('The applicant details were normalized for bureau matching.');

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

    this.logger.log('The bureau master lookup was completed.');

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

    const rawResponse = this.buildRawResponse(cibilReport, application.application_number);

    this.logger.log('The raw bureau response was prepared successfully.');

    this.logger.log('The target application status was found successfully.');

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

      this.logger.log('The application status was updated after the credit check.');

      return creditCheck;
    });

    this.logger.log(
      `Credit score check completed successfully for application with ID: ${application.application_id}`,
    );

    return createdCheck as CreditScoreCheckResponseDto;
  }

  private buildRawResponse(
    cibilReport: CibilReportWithRelations,
    applicationNumber: string,
  ): Prisma.InputJsonObject {
    this.logger.log('The bureau response is being converted into the stored JSON format.');

    return {
      score: cibilReport.cibil_score ?? 0,
      bureau: cibilReport.bureau ?? 'CIBIL',
      request_id: cibilReport.request_id ?? '',
      risk_level: cibilReport.risk_level ?? '',
      score_band: cibilReport.score_band ?? '',
      report_date: cibilReport.report_date ? cibilReport.report_date.toISOString() : '',
      reference_id: cibilReport.reference_id ?? '',
      total_accounts: cibilReport.total_accounts ?? 0,
      active_accounts: cibilReport.active_accounts ?? 0,
      closed_accounts: cibilReport.closed_accounts ?? 0,
      application_number: applicationNumber,
      recent_delinquency: cibilReport.recent_delinquency ?? false,
      debt_to_income_estimate: this.toStringValue(cibilReport.debt_to_income_estimate),
      credit_utilization_ratio: this.toStringValue(cibilReport.credit_utilization_ratio),
      average_account_age_years: this.toStringValue(cibilReport.average_account_age_years),
      total_outstanding_balance: this.toStringValue(cibilReport.total_outstanding_balance),
    } satisfies Prisma.InputJsonObject;
  }

  private toStringValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '0';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof Prisma.Decimal) {
      return value.toString();
    }

    return '0';
  }
}
