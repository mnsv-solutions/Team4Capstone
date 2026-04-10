// This DTO is used to return team dashboard application details.
export class TeamDashboardDto {
  // This is the unique ID of the application.
  applicationId?: string;

  // This is the application number shown for reference.
  applicationNumber?: string;

  // This stores the customer's full name, if available.
  customerName?: string | null;

  // This stores the application or loan type, if available.
  type?: string | null;

  // This stores the main loan amount, if available.
  principalAmount?: number | null;

  // This stores the loan tenure, usually in months.
  tenure?: number | null;

  // This stores the interest rate, if available.
  interestRate?: number | null;

  // This stores the total payable amount.
  totalAmount?: number;

  // This stores the remaining balance amount.
  balance?: number;

  // This stores the next payment amount.
  nextPayment?: number;

  // This stores the due date of the next payment, if available.
  nextPaymentDate?: Date | null;

  // This shows the current application status.
  status?: string | null;

  // This stores the date when the application was created.
  applicationCreationDate?: Date;

  // This shows the user currently assigned to the application, if available.
  assignedTo?: string | null;
}
