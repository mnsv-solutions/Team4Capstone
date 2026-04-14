/**
 * Generate Repayment Schedule Response DTO
 *
 * This DTO represents the response from the generate repayment schedule API.
 *
 * @property {string} message - A message describing the result of the API call.
 * @property {string} applicationNumber - The application number.
 * @property {string} applicationId - The ID of the application.
 * @property {number} emi - The equated monthly installment (EMI) for the repayment schedule.
 */
export class GenerateRepaymentScheduleResponseDto {
  message: string;
  applicationNumber: string;
  applicationId: string;
  emi: number;
}
