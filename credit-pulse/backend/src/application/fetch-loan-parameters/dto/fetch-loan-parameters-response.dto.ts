import { CalculateEligibilityResponseDto } from '../../../calculate-eligibility/dto/calculate-eligibility-response.dto.js';
import { CalculateRatiosResponseDto } from '../../../calculate-ratios/dto/calculate-ratios-response.dto.js';
import { GenerateRepaymentScheduleResponseDto } from '../../../generate-repayment-schedule/dto/generate-repayment-schedule-response.dto.js';

/**
 * This DTO is used to store one installment from the repayment schedule.
 */
export class RepaymentScheduleInstallmentDto {
  // Unique ID of the schedule record.
  scheduleId?: string;

  // Installment number in the repayment schedule.
  installmentNumber?: number;

  // Due date of the installment.
  dueDate?: string;

  // Balance amount before this installment is applied.
  openingBalance?: number;

  // Portion of the installment that goes toward the principal amount.
  principalComponent?: number;

  // Portion of the installment that goes toward interest.
  interestComponent?: number;

  // Total amount to be paid for this installment.
  installmentAmount?: number;

  // Remaining balance after this installment.
  closingBalance?: number;

  // Amount that has already been paid for this installment.
  paidAmount?: number;

  // Current payment status of the installment.
  paymentStatus?: string;

  // Date when the installment was paid, if available.
  paidDate?: string | null;
}

/**
 * This DTO includes the repayment summary along with all installment details.
 */
export class RepaymentScheduleDetailsDto extends GenerateRepaymentScheduleResponseDto {
  // Total number of installments in the repayment schedule.
  totalInstallments?: number;

  // Full list of installment records.
  installments?: RepaymentScheduleInstallmentDto[];
}

/**
 * This DTO returns all loan parameter details in one response.
 */
export class FetchLoanParametersResponseDto {
  // Message returned with the response.
  message?: string;

  // Application number linked to these loan details.
  applicationNumber?: string;

  // Repayment schedule details for the application.
  repaymentSchedule?: RepaymentScheduleDetailsDto;

  // Calculated financial ratios for the application.
  ratios?: CalculateRatiosResponseDto;

  // Eligibility result for the application.
  eligibility?: CalculateEligibilityResponseDto;
}
