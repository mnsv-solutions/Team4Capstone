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

// This service is used to collect all loan parameter details in one place.
@Injectable()
export class FetchLoanParametersService {
  constructor(
    // This is used to read repayment schedule data from the database.
    private readonly prisma: PrismaService,

    // This service is used to generate the repayment schedule.
    private readonly generateRepaymentScheduleService: GenerateRepaymentScheduleService,

    // This service is used to calculate financial ratios.
    private readonly calculateRatiosService: CalculateRatiosService,

    // This service is used to calculate eligibility.
    private readonly calculateEligibilityService: CalculateEligibilityService,
  ) {}

  // This method gets repayment schedule, ratios, and eligibility in one response.
  async fetchLoanParameters(
    dto: FetchLoanParametersRequestDto,
    userId: string,
  ): Promise<FetchLoanParametersResponseDto> {
    // This first generates the repayment schedule for the given application.
    const repaymentScheduleResult = await this.generateRepaymentScheduleService.generateSchedule(
      dto,
      userId,
    );

    // This then reads the saved installment records from the database.
    const installmentRows = await this.prisma.repayment_schedule.findMany({
      where: {
        application_id: repaymentScheduleResult.applicationId,
        is_active: true,
      },
      orderBy: {
        installment_number: 'asc',
      },
    });

    // This converts the installment records into the response format.
    const installments: RepaymentScheduleInstallmentDto[] = installmentRows.map((row) => ({
      // This is the unique ID of the schedule row.
      scheduleId: row.schedule_id,

      // This is the installment number in the schedule.
      installmentNumber: row.installment_number,

      // This is the due date of the installment.
      dueDate: row.due_date.toISOString(),

      // This is the opening balance before this installment.
      openingBalance: this.toNumber(row.opening_balance),

      // This is the principal part of the installment.
      principalComponent: this.toNumber(row.principal_component),

      // This is the interest part of the installment.
      interestComponent: this.toNumber(row.interest_component),

      // This is the total installment amount.
      installmentAmount: this.toNumber(row.installment_amount),

      // This is the balance left after this installment.
      closingBalance: this.toNumber(row.closing_balance),

      // This is the amount already paid for this installment.
      paidAmount: this.toNumber(row.paid_amount),

      // This shows the current payment status.
      paymentStatus: row.payment_status,

      // This stores the paid date if the installment has been paid.
      paidDate: row.paid_date ? row.paid_date.toISOString() : null,
    }));

    // This calculates the ratios for the same application.
    const ratiosResult = await this.calculateRatiosService.calculateRatios(
      {
        applicationNumber: dto.applicationNumber,
      },
      userId,
    );

    // This calculates the eligibility after ratios are ready.
    const eligibilityResult = await this.calculateEligibilityService.calculateEligibility(
      {
        applicationNumber: dto.applicationNumber,
      },
      userId,
    );

    // This returns the final combined response.
    return {
      // This message shows that the request was completed successfully.
      message: 'Loan parameters fetched successfully.',

      // This returns the application number for reference.
      applicationNumber: dto.applicationNumber,

      // This returns the repayment schedule details.
      repaymentSchedule: {
        ...repaymentScheduleResult,

        // This shows the total number of installments.
        totalInstallments: installments.length,

        // This returns the full installment list.
        installments,
      },

      // This returns the calculated ratio details.
      ratios: ratiosResult,

      // This returns the eligibility result.
      eligibility: eligibilityResult,
    };
  }

  // This helper converts different value types into a normal number.
  private toNumber(value: unknown): number {
    // This returns 0 if the value is missing.
    if (value === null || value === undefined) {
      return 0;
    }

    // This returns the value directly if it is already a number.
    if (typeof value === 'number') {
      return value;
    }

    // This converts bigint values into a normal number.
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
      // This uses toNumber() if the object supports it.
      if ('toNumber' in value && typeof value.toNumber === 'function') {
        const parsed = Number(value.toNumber());
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      // This uses valueOf() if it is available.
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
