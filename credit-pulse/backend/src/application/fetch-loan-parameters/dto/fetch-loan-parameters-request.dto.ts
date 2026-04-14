import { GenerateRepaymentScheduleRequestDto } from '../../../generate-repayment-schedule/dto/generate-repayment-schedule-request.dto.js';

/**
 * This request DTO is intentionally kept the same as the Generate Repayment Schedule request.
 * It accepts application number, loan amount, interest rate, and tenure months.
 */
export class FetchLoanParametersRequestDto extends GenerateRepaymentScheduleRequestDto {}
