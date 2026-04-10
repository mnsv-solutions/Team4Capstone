import { Injectable } from '@nestjs/common';

import { CalculateEligibilityService } from '../../calculate-eligibility/calculate-eligibility.service.js';
import { CalculateRatiosService } from '../../calculate-ratios/calculate-ratios.service.js';
import { GenerateRepaymentScheduleService } from '../../generate-repayment-schedule/generate-repayment-schedule.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FetchLoanParametersRequestDto } from './dto/fetch-loan-parameters-request.dto.js';
import {
  FetchLoanParametersResponseDto,
  RepaymentScheduleInstallmentDto,
} from './dto/fetch-loan-parameters-response.dto.js';

// This service brings together repayment schedule, ratio, and eligibility details.
@Injectable()
export class FetchLoanParametersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateRepaymentScheduleService: GenerateRepaymentScheduleService,
    private readonly calculateRatiosService: CalculateRatiosService,
    private readonly calculateEligibilityService: CalculateEligibilityService,
  ) {}

  // This method fetches all loan-related details and returns them in one response.
  async fetchLoanParameters(
    dto: FetchLoanParametersRequestDto,
    userId: string,
  ): Promise<FetchLoanParametersResponseDto> {
    // First, it generates the repayment schedule for the application.
    const repaymentScheduleResult = await this.generateRepaymentScheduleService.generateSchedule(
      dto,
      userId,
    );

    // Then, it reads all saved installment rows from the database.
    const installmentRows = await this.prisma.repayment_schedule.findMany({
      where: {
        application_id: repaymentScheduleResult.applicationId,
        is_active: true,
      },
      orderBy: {
        installment_number: 'asc',
      },
    });

    // This converts the database rows into a cleaner installment list for the response.
    const installments: RepaymentScheduleInstallmentDto[] = installmentRows.map((row) => ({
      scheduleId: row.schedule_id,
      installmentNumber: row.installment_number,
      dueDate: row.due_date.toISOString(),
      openingBalance: this.toNumber(row.opening_balance),
      principalComponent: this.toNumber(row.principal_component),
      interestComponent: this.toNumber(row.interest_component),
      installmentAmount: this.toNumber(row.installment_amount),
      closingBalance: this.toNumber(row.closing_balance),
      paidAmount: this.toNumber(row.paid_amount),
      paymentStatus: row.payment_status,
      paidDate: row.paid_date ? row.paid_date.toISOString() : null,
    }));

    // Next, it calculates the financial ratios for the same application.
    const ratiosResult = await this.calculateRatiosService.calculateRatios(
      {
        applicationNumber: dto.applicationNumber,
      },
      userId,
    );

    // After that, it calculates eligibility using the same application number.
    const eligibilityResult = await this.calculateEligibilityService.calculateEligibility(
      {
        applicationNumber: dto.applicationNumber,
      },
      userId,
    );

    // Finally, it returns all collected details in one combined response.
    return {
      message: 'Loan parameters fetched successfully.',
      applicationNumber: dto.applicationNumber,
      repaymentSchedule: {
        ...repaymentScheduleResult,
        totalInstallments: installments.length,
        installments,
      },
      ratios: ratiosResult,
      eligibility: eligibilityResult,
    };
  }

  // This helper changes Prisma decimal and other values into normal numbers.
  private toNumber(value: unknown): number {
    // This returns 0 when the value is missing.
    if (value === null || value === undefined) {
      return 0;
    }

    // This returns the value directly if it is already a number.
    if (typeof value === 'number') {
      return value;
    }

    // This converts bigint values into numbers.
    if (typeof value === 'bigint') {
      return Number(value);
    }

    // This converts string values into numbers.
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    // This handles object values such as Prisma Decimal.
    if (typeof value === 'object') {
      // This uses toNumber() when the object supports it.
      if ('toNumber' in value && typeof value.toNumber === 'function') {
        const parsed = Number(value.toNumber());
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      // This uses valueOf() when available.
      if ('valueOf' in value && typeof value.valueOf === 'function') {
        const parsed = Number(value.valueOf());
        return Number.isNaN(parsed) ? 0 : parsed;
      }
    }

    // This is the final fallback conversion.
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
