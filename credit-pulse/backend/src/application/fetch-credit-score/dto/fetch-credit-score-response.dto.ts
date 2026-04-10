// This DTO is used to return credit score details in the response.
export class FetchCreditScoreResponseDto {
  // This shows the customer's credit score.
  score?: number;

  // This shows the risk level based on the credit report.
  risk_level?: string;

  // This stores the date when the credit report was generated.
  report_date?: string;

  // This stores the reference ID of the credit report.
  reference_id?: string;

  // This shows the total number of credit accounts.
  total_accounts?: number;

  // This shows how many credit accounts are currently active.
  active_accounts?: number;

  // This shows how many credit accounts have been closed.
  closed_accounts?: number;

  // This stores the estimated debt-to-income ratio.
  debt_to_income_estimate?: string;

  // This stores the credit utilization ratio.
  credit_utilization_ratio?: string;

  // This stores the average age of all accounts in years.
  average_account_age_years?: string;

  // This stores the total outstanding balance across all accounts.
  total_outstanding_balance?: string;
}
