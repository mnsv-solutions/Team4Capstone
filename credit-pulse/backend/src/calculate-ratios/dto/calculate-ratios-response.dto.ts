/**
 * Response DTO for calculate ratios
 *
 * @property {string} message - Message related to the calculation result
 * @property {string} applicationNumber - Unique application number linked to the loan record
 * @property {string} customerId - Unique customer ID linked to the loan record
 * @property {number} monthlyIncome - Monthly income of the customer
 * @property {number} annualIncome - Annual income of the customer
 * @property {number} totalMonthlyDebtPayments - Total monthly debt payments
 * @property {number} proposedEmi - Proposed EMI for the loan
 * @property {number} requestedLoanAmount - Requested loan amount
 * @property {number} dbr - Debt-to-Balance ratio of the customer
 * @property {number} emiToIncome - EMI-to-Income ratio of the customer
 * @property {number} creditUtilization - Credit utilizationization ratio of the customer
 * @property {number} loanToIncome - Loan-to-Income ratio of the customer
 */
export class CalculateRatiosResponseDto {
  message: string;
  applicationNumber: string;
  customerId: string;
  monthlyIncome: number;
  annualIncome: number;
  totalMonthlyDebtPayments: number;
  proposedEmi: number;
  requestedLoanAmount: number;
  dbr: number;
  emiToIncome: number;
  creditUtilization: number;
  loanToIncome: number;
}
