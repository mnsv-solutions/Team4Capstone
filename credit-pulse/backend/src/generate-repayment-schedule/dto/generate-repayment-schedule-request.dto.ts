import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';

/**
 * DTO for generating repayment schedule
 *
 * @property {string} applicationNumber - Unique application number linked to the loan record
 * @property {number} loanAmount - Total approved loan amount for schedule generation
 * @property {number} interestRate - Annual interest rate used to calculate EMI and balances
 * @property {number} tenureMonths - Total payment duration in months
 */
export class GenerateRepaymentScheduleRequestDto {
  // Application number linked to the loan record
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must start with APPL followed by exactly 10 digits',
  })
  applicationNumber: string;

  // Total approved loan amount for schedule generation
  @Type(() => Number)
  @IsNumber({}, { message: 'Loan Amount must be a number.' })
  @Min(0.01, { message: 'Loan Amount must be greater than 0.' })
  loanAmount: number;

  // Annual interest rate used to calculate EMI and balances
  @Type(() => Number)
  @IsNumber({}, { message: 'Interest Rate must be a number.' })
  @Min(0, { message: 'Interest Rate cannot be negative.' })
  interestRate: number;

  // Total payment duration in months
  @Type(() => Number)
  @IsNumber({}, { message: 'Tenure Months must be a number.' })
  @Min(1, { message: 'Tenure Months must be at least 1.' })
  tenureMonths: number;
}
