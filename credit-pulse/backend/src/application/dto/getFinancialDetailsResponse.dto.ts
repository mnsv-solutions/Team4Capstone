export class BankAccountResponseDto {
  bankName?: string;
  institutionNumber?: string;
  transitNumber?: string;
  accountNumber?: string;
  accountType?: string;
  swiftBic?: string;
  isRepaymentAccount?: boolean;
}

export class GetFinancialDetailsResponseDto {
  requestedAmount?: string;
  tenureMonths?: number;
  interestRate?: string;
  approvedLoanAmount?: string;
  approvedInterestRate?: string;
  approvedTenureMonths?: number;

  productId?: string;
  productCode?: string;
  productName?: string;

  employmentStatus?: string;
  employerName?: string;
  jobTitle?: string;
  workExperience?: string;
  monthlyIncome?: string;
  otherIncomeSources?: string;
  existingLoans?: string;
  totalMonthlyLoanPayments?: string;
  bankAccounts?: BankAccountResponseDto[];
}
