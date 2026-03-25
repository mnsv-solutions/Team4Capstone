/**
 * Dashboard DTO
 *
 * This DTO represents the data that is displayed on the dashboard.
 *
 * @property {string} applicationId - The ID of the application.
 * @property {string} applicationNumber - The application number.
 * @property {string | null} customerName - The name of the customer.
 * @property {string | null} type - The type of the application.
 * @property {number | null} principalAmount - The principal amount of the application.
 * @property {number | null} tenure - The tenure of the application.
 * @property {number | null} interestRate - The interest rate of the application.
 * @property {number} totalAmount - The total amount of the application.
 * @property {number} balance - The balance of the application.
 * @property {number} nextPayment - The next payment amount of the application.
 * @property {Date | null} nextPaymentDate - The next payment date of the application.
 * @property {string | null} status - The status of the application.
 * @property {Date} applicationCreationDate - The date the application was created.
 */

export class DashboardDto {
  applicationId: string;
  applicationNumber: string;
  customerName: string | null;
  type: string | null;
  principalAmount: number | null;
  tenure: number | null;
  interestRate: number | null;
  totalAmount: number;
  balance: number;
  nextPayment: number;
  nextPaymentDate: Date | null;
  status: string | null;
  applicationCreationDate: Date;
}
