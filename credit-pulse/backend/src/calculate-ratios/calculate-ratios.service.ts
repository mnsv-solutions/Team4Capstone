import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CalculateRatiosRequestDto } from './dto/calculate-ratios-request.dto.js';
import { CalculateRatiosResponseDto } from './dto/calculate-ratios-response.dto.js';

@Injectable()
export class CalculateRatiosService {
  private readonly logger = new Logger(CalculateRatiosService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * This function calculates various ratios for a given loan application.
   *
   * It takes in a CalculateRatiosRequestDto, which contains the application number and other required details.
   * It then uses the PrismaService to fetch the application, primary applicant, employment details, liabilities, and latest CIBIL report.
   *
   * It calculates the monthly income, total monthly debt payments, proposed EMI, requested loan amount, annual income, debt-to-balance ratio, EMI-to-income ratio, credit utilizationization ratio, and loan-to-income ratio.
   *
   * It then updates or creates a new application ratio summary record in the database with the calculated ratios.
   *
   * @param dto - The request DTO containing the application number and other required details.
   * @param userId - The ID of the user who is making the request.
   *
   * @returns A promise that resolves to a CalculateRatiosResponseDto, which contains the calculated ratios.
   */
  async calculateRatios(
    dto: CalculateRatiosRequestDto,
    userId: string,
  ): Promise<CalculateRatiosResponseDto> {
    this.logger.log('The ratio calculation process has started.');

    // Fetch the application
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: dto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
        requested_amount: true,
        approved_emi: true,
      },
    });

    if (!application) {
      this.logger.warn(
        `No active loan application was found for application number: ${dto.applicationNumber}`,
      );
      throw new NotFoundException('Loan application not found');
    }

    this.logger.log(
      `The loan application was found for application number: ${dto.applicationNumber}`,
    );

    // Fetch the primary applicant
    const primaryApplicant = await this.prisma.sub_loan.findFirst({
      where: {
        application_id: application.application_id,
        applicant_type: 0,
        is_active: true,
      },
      select: {
        customer_id: true,
      },
    });

    if (!primaryApplicant) {
      this.logger.warn('The primary applicant could not be found for the selected application.');
      throw new NotFoundException('Primary applicant not found for this application');
    }

    this.logger.log('The primary applicant was found successfully.');

    // Fetch the employment details
    const employment = await this.prisma.customer_employment_details.findUnique({
      where: {
        customer_id: primaryApplicant.customer_id,
      },
      select: {
        monthly_income: true,
      },
    });

    this.logger.log('The employment details were fetched successfully.');

    // Fetch the liabilities
    const liabilities = await this.prisma.customer_liabilities.findMany({
      where: {
        customer_id: primaryApplicant.customer_id,
        is_active: true,
      },
      select: {
        monthly_payment: true,
      },
    });

    this.logger.log(
      `The liability details were fetched successfully. Total records found: ${liabilities.length}`,
    );

    // Fetch the latest CIBIL report
    const latestCibilReport = await this.prisma.cibil_reports.findFirst({
      where: {
        application_id: application.application_id,
      },
      orderBy: {
        report_date: 'desc',
      },
      select: {
        cibil_report_id: true,
        credit_utilization_ratio: true,
        cibil_accounts: {
          select: {
            current_balance: true,
            credit_limit: true,
          },
        },
      },
    });

    this.logger.log('The latest CIBIL report was fetched successfully.');

    // Calculate the monthly income
    const monthlyIncome = this.toNumber(employment?.monthly_income);

    if (monthlyIncome <= 0) {
      this.logger.warn(
        'The ratio calculation could not continue because monthly income is missing.',
      );
      throw new BadRequestException('Monthly income is missing for the selected applicant');
    }

    this.logger.log('The monthly income was prepared successfully.');

    // Calculate the total monthly debt payments
    const totalMonthlyDebtPayments = this.round(
      liabilities.reduce((sum, row) => sum + this.toNumber(row.monthly_payment), 0),
      2,
    );

    this.logger.log('The total monthly debt payments were calculated successfully.');

    // Calculate the proposed EMI
    let proposedEmi = this.toNumber(application.approved_emi);

    if (proposedEmi <= 0) {
      this.logger.log(
        'Approved EMI was not available, so the first repayment schedule is being checked.',
      );

      // Fetch the first repayment schedule
      const firstSchedule = await this.prisma.repayment_schedule.findFirst({
        where: {
          application_id: application.application_id,
          is_active: true,
        },
        orderBy: {
          installment_number: 'asc',
        },
        select: {
          installment_amount: true,
        },
      });

      proposedEmi = this.toNumber(firstSchedule?.installment_amount);
    }

    if (proposedEmi <= 0) {
      this.logger.warn(
        'The ratio calculation could not continue because proposed EMI is not available.',
      );
      throw new BadRequestException(
        'Approved EMI is not available. Generate payment schedule first.',
      );
    }

    this.logger.log('The proposed EMI was prepared successfully.');

    // Calculate the requested loan amount
    const requestedLoanAmount = this.toNumber(application.requested_amount);

    // Calculate the annual income
    const annualIncome = this.round(monthlyIncome * 12, 2);

    // Calculate the debt-to-balance ratio
    const dbr = this.safePercentage(totalMonthlyDebtPayments, monthlyIncome);

    // Calculate the EMI-to-income ratio
    const emiToIncome = this.safePercentage(proposedEmi, monthlyIncome);

    // Calculate the credit utilizationization ratio
    const creditUtilization = this.resolveCreditUtilization(
      latestCibilReport?.credit_utilization_ratio,
      latestCibilReport?.cibil_accounts ?? [],
    );

    // Calculate the loan-to-income ratio
    const loanToIncome = annualIncome > 0 ? this.round(requestedLoanAmount / annualIncome, 4) : 0;

    this.logger.log('All financial ratios were calculated successfully.');

    // Update or create a new application ratio summary record in the database
    await this.prisma.application_ratio_summary.upsert({
      where: {
        application_id: application.application_id,
      },
      update: {
        application_number: application.application_number,
        customer_id: primaryApplicant.customer_id,
        dbr,
        emi_to_income: emiToIncome,
        credit_utilization: creditUtilization,
        loan_to_income: loanToIncome,
        monthly_income: this.round(monthlyIncome, 2),
        annual_income: annualIncome,
        total_monthly_debt_payments: totalMonthlyDebtPayments,
        proposed_emi: this.round(proposedEmi, 2),
        requested_loan_amount: this.round(requestedLoanAmount, 2),
        cibil_report_id: latestCibilReport?.cibil_report_id ?? null,
        calculation_version: 'v1',
        calculated_at: new Date(),
        updated_by: userId,
        input_snapshot_json: {
          applicationNumber: application.application_number,
          monthlyIncome: this.round(monthlyIncome, 2),
          annualIncome,
          totalMonthlyDebtPayments,
          proposedEmi: this.round(proposedEmi, 2),
          requestedLoanAmount: this.round(requestedLoanAmount, 2),
          creditUtilization,
        },
      },
      create: {
        application_id: application.application_id,
        application_number: application.application_number,
        customer_id: primaryApplicant.customer_id,
        dbr,
        emi_to_income: emiToIncome,
        credit_utilization: creditUtilization,
        loan_to_income: loanToIncome,
        monthly_income: this.round(monthlyIncome, 2),
        annual_income: annualIncome,
        total_monthly_debt_payments: totalMonthlyDebtPayments,
        proposed_emi: this.round(proposedEmi, 2),
        requested_loan_amount: this.round(requestedLoanAmount, 2),
        cibil_report_id: latestCibilReport?.cibil_report_id ?? null,
        calculation_version: 'v1',
        calculated_at: new Date(),
        created_by: userId,
        updated_by: userId,
        is_active: true,
        input_snapshot_json: {
          applicationNumber: application.application_number,
          monthlyIncome: this.round(monthlyIncome, 2),
          annualIncome,
          totalMonthlyDebtPayments,
          proposedEmi: this.round(proposedEmi, 2),
          requestedLoanAmount: this.round(requestedLoanAmount, 2),
          creditUtilization,
        },
      },
    });

    this.logger.log('The application ratio summary was saved successfully.');

    // Return the calculated ratios
    return {
      message: 'Ratios calculated successfully',
      applicationNumber: application.application_number,
      customerId: primaryApplicant.customer_id,
      monthlyIncome: this.round(monthlyIncome, 2),
      annualIncome,
      totalMonthlyDebtPayments,
      proposedEmi: this.round(proposedEmi, 2),
      requestedLoanAmount: this.round(requestedLoanAmount, 2),
      dbr,
      emiToIncome,
      creditUtilization,
      loanToIncome,
    };
  }
  /**
   * Resolve the credit utilizationization percentage from a given CIBIL report.
   *
   * If the CIBIL report provides a direct credit utilizationization value, it will be used.
   * The value will be rounded to two decimal places if it is less than or equal to 1, and to zero decimal places otherwise.
   *
   * If the CIBIL report does not provide a direct credit utilizationization value, the method will calculate it from the provided list of accounts.
   * The total current balance and total credit limit of all accounts will be calculated, and the credit utilizationization percentage will be calculated from these totals.
   * The percentage will be rounded to two decimal places using the safePercentage method.
   *
   * @param reportValue - The direct credit utilizationization value from the CIBIL report
   * @param accounts - The list of accounts to calculate the credit utilizationization from
   * @returns The resolved credit utilizationization percentage
   */
  private resolveCreditUtilization(
    reportValue: unknown,
    accounts: Array<{ current_balance: unknown; credit_limit: unknown }>,
  ): number {
    const directValue = this.toNumber(reportValue);

    // If the CIBIL report provides a direct credit utilizationization value, use it
    if (directValue > 0) {
      // Round the value to two decimal places if it is less than or equal to 1, and to zero decimal places otherwise
      return directValue <= 1 ? this.round(directValue * 100, 2) : this.round(directValue, 2);
    }

    // If the CIBIL report does not provide a direct credit utilizationization value, calculate it from the provided list of accounts
    const totals = accounts.reduce(
      (acc, account) => {
        const currentBalance = this.toNumber(account.current_balance);
        const creditLimit = this.toNumber(account.credit_limit);

        // If the credit limit is greater than zero, add the current balance and credit limit to the totals
        if (creditLimit > 0) {
          acc.balance += currentBalance;
          acc.limit += creditLimit;
        }

        return acc;
      },
      // Initialize the totals with zero balance and zero limit
      { balance: 0, limit: 0 },
    );

    // If the total limit is less than or equal to zero, return zero credit utilizationization
    if (totals.limit <= 0) {
      return 0;
    }

    // Calculate the credit utilizationization percentage from the totals
    return this.safePercentage(totals.balance, totals.limit);
  }

  /**
   * Safely calculates a percentage value from a numerator and denominator.
   *
   * This function first checks if the denominator is less than or equal to zero. If it is, the function returns zero, as the percentage calculation would be undefined.
   *
   * If the denominator is greater than zero, the function then calculates the percentage by dividing the numerator by the denominator and multiplying by 100.
   * The result is then rounded to the nearest two decimal places using the Math.round() function.
   *
   * The purpose of this function is to prevent division by zero, and to round the result to a reasonable number of decimal places.
   *
   * @param numerator - The value to be divided
   * @param denominator - The value to divide by
   * @returns The calculated percentage, or 0 if the denominator is less than or equal to zero
   */
  private safePercentage(numerator: number, denominator: number): number {
    if (denominator <= 0) {
      return 0;
    }

    // Calculate the percentage by dividing the numerator by the denominator and multiplying by 100
    const percentage = (numerator / denominator) * 100;

    // Round the result to the nearest two decimal places
    return this.round(percentage, 2);
  }

  /**
   * Rounds a number to the specified number of decimal places.
   *
   * This method works by first multiplying the input value by a factor of 10 to the power of the number of decimal places.
   * This effectively shifts the decimal point of the number to the right by the specified number of places.
   * The value is then rounded to the nearest integer using the Math.round() function.
   * Finally, the value is divided by the same factor to shift the decimal point back to its original position.
   *
   * For example, if the input value is 12.345 and the number of decimal places is 2, the method will first multiply the value by 100 (10^2) to get 1234.5.
   * The value is then rounded to 1234.5.
   * Finally, the value is divided by 100 to get 12.35.
   *
   * @param value The number to be rounded.
   * @param decimals The number of decimal places to round to. Defaults to 2.
   * @returns The rounded number.
   */
  private round(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  /**
   * Safely converts an unknown value into a number.
   * If the value is null or undefined, returns 0.
   * If the value is already a number, returns the value unchanged.
   * If the value is a BigInt, converts it to a number.
   * If the value is a string, attempts to parse it as a number.
   * If the value is an object, checks if it has a toNumber() method,
   * and if so, calls it to convert the value to a number.
   * If the object has a valueOf() method, calls it to get the primitive value,
   * and then recursively calls this method to convert the primitive value to a number.
   * If all else fails, returns 0.
   *
   * This method is used to handle cases where the input value may be null, undefined, a string that can't be parsed as a number,
   * or an object that wraps a numeric value.
   *
   * @param value - The value to convert.
   * @returns The converted number, or 0 if the conversion fails or if the value is missing.
   */
  private toNumber(value: unknown): number {
    // If the value is null or undefined, return 0.
    if (value === null || value === undefined) {
      return 0;
    }

    // If the value is already a number, return the value unchanged.
    if (typeof value === 'number') {
      return value;
    }

    // If the value is a BigInt, convert it to a number.
    if (typeof value === 'bigint') {
      return Number(value);
    }

    // If the value is a string, attempt to parse it as a number.
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    // If the value is an object, check if it has a toNumber() method.
    if (typeof value === 'object') {
      // If the object has a toNumber() method, call it to convert the value to a number.
      if ('toNumber' in value && typeof value.toNumber === 'function') {
        const parsed = Number(value.toNumber());
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      // If the object has a valueOf() method, call it to get the primitive value.
      if ('valueOf' in value && typeof value.valueOf === 'function') {
        const primitive = value.valueOf();

        // If the primitive value is different from the original value, recursively call this method to convert the primitive value to a number.
        if (primitive !== value) {
          return this.toNumber(primitive);
        }
      }
    }

    // If all else fails, return 0.
    return 0;
  }
}
