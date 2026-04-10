import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { FetchCreditScoreRequestDto } from './dto/fetch-credit-score-request.dto.js';
import { FetchCreditScoreResponseDto } from './dto/fetch-credit-score-response.dto.js';

// This service handles the logic for fetching credit score details.
@Injectable()
export class FetchCreditScoreService {
  constructor(private readonly prisma: PrismaService) {}

  // This method finds the latest credit score record for the given application.
  async fetchCreditScore(dto: FetchCreditScoreRequestDto): Promise<FetchCreditScoreResponseDto> {
    // This finds the application using the application number.
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: dto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
      },
    });

    // This throws an error if the application does not exist.
    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    // This gets the latest credit check record linked to the application.
    const latestCreditCheck = await this.prisma.application_credit_check.findFirst({
      where: {
        application_id: application.application_id,
        is_latest: true,
      },
      orderBy: {
        checked_at: 'desc',
      },
      select: {
        raw_response: true,
      },
    });

    // This throws an error if no credit check record is found.
    if (!latestCreditCheck) {
      throw new NotFoundException('Credit check record not found for this application.');
    }

    // This checks whether the raw credit response is available.
    if (latestCreditCheck.raw_response == null) {
      throw new BadRequestException('Raw CIBIL response is not available for this application.');
    }

    // This converts the raw response into a cleaner summary format.
    return this.mapRawResponseToSummary(latestCreditCheck.raw_response);
  }

  // This method maps the raw CIBIL response into the response DTO format.
  private mapRawResponseToSummary(rawResponse: unknown): FetchCreditScoreResponseDto {
    const data = this.asObject(rawResponse);

    return {
      score: this.readRequiredNumber(data.score, 'score'),
      risk_level: this.readRequiredString(data.risk_level, 'risk_level'),
      report_date: this.readRequiredString(data.report_date, 'report_date'),
      reference_id: this.readRequiredString(data.reference_id, 'reference_id'),
      total_accounts: this.readRequiredNumber(data.total_accounts, 'total_accounts'),
      active_accounts: this.readRequiredNumber(data.active_accounts, 'active_accounts'),
      closed_accounts: this.readRequiredNumber(data.closed_accounts, 'closed_accounts'),
      debt_to_income_estimate: this.readRequiredDecimalString(
        data.debt_to_income_estimate,
        'debt_to_income_estimate',
      ),
      credit_utilization_ratio: this.readRequiredDecimalString(
        data.credit_utilization_ratio,
        'credit_utilization_ratio',
      ),
      average_account_age_years: this.readRequiredDecimalString(
        data.average_account_age_years,
        'average_account_age_years',
      ),
      total_outstanding_balance: this.readRequiredDecimalString(
        data.total_outstanding_balance,
        'total_outstanding_balance',
      ),
    };
  }

  // This method makes sure the raw response is a valid object.
  private asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Raw CIBIL response format is invalid.');
    }

    return value as Record<string, unknown>;
  }

  // This method reads a required number field from the raw response.
  private readRequiredNumber(value: unknown, fieldName: string): number {
    const parsedValue = Number(value);

    if (value === null || value === undefined || Number.isNaN(parsedValue)) {
      throw new BadRequestException(`Invalid or missing value in raw_response for ${fieldName}.`);
    }

    return parsedValue;
  }

  // This method reads a required text field from the raw response.
  private readRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`Invalid or missing value in raw_response for ${fieldName}.`);
    }

    return value;
  }

  // This method reads a required numeric field and returns it as a string.
  private readRequiredDecimalString(value: unknown, fieldName: string): string {
    const parsedValue = this.readRequiredNumber(value, fieldName);
    return String(parsedValue);
  }
}
