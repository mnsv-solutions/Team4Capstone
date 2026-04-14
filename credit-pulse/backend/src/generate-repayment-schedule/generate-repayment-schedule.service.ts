import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { GenerateRepaymentScheduleRequestDto } from './dto/generate-repayment-schedule-request.dto.js';
import { GenerateRepaymentScheduleResponseDto } from './dto/generate-repayment-schedule-response.dto.js';

/**
 * Service for generating repayment schedules for loan applications.
 *
 * This service encapsulates Prisma queries for generating payment schedules.
 * It provides methods for generating payment schedules, checking for existing payment records,
 * and preventing schedule regeneration once payment history already exists.
 *
 * @module GenerateRepaymentScheduleService
 * @imports [PrismaService]
 * @exports [GenerateRepaymentScheduleService]
 */
@Injectable()
export class GenerateRepaymentScheduleService {
  private readonly logger = new Logger(GenerateRepaymentScheduleService.name);

  // Gives access to Prisma queries inside this service
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a repayment schedule for a given loan application.
   *
   * @param dto - GenerateRepaymentScheduleRequestDto containing application number, loan amount, interest rate, and tenure months.
   * @param userId - The ID of the user generating the schedule.
   * @returns A promise that resolves to a GenerateRepaymentScheduleResponseDto containing a success message and the generated repayment schedule.
   *
   * This function first finds the active loan application using the application number.
   * It then checks whether any payment has already been recorded for this application, and prevents schedule regeneration once payment history already exists.
   * Finally, it builds all payment schedule rows based on input values, and updates the approved EMI in one transaction.
   */
  async generateSchedule(
    dto: GenerateRepaymentScheduleRequestDto,
    userId: string,
  ): Promise<GenerateRepaymentScheduleResponseDto> {
    this.logger.log('The repayment schedule generation process has started.');

    // Finds the active loan application using the application number
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: dto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
      },
    });

    // Stops the flow if the application does not exist
    if (!application) {
      this.logger.warn(
        `No active loan application was found for application number: ${dto.applicationNumber}`,
      );
      throw new NotFoundException('Loan application not found');
    }

    this.logger.log(
      `The loan application was found for application number: ${dto.applicationNumber}`,
    );

    // Checks whether any payment has already been recorded for this application
    const paymentCount = await this.prisma.loan_payment.count({
      where: {
        application_id: application.application_id,
        is_active: true,
      },
    });

    // Prevents schedule regeneration once payment history already exists
    if (paymentCount > 0) {
      this.logger.warn(
        'The repayment schedule could not be regenerated because payment records already exist.',
      );
      throw new BadRequestException(
        'Repayment schedule cannot be regenerated because payment records already exist for this application.',
      );
    }

    this.logger.log('No payment records were found, so the repayment schedule can be generated.');

    // Builds all repayment schedule rows based on input values
    const scheduleRows = this.buildRepaymentSchedule(
      application.application_id,
      dto.loanAmount,
      dto.interestRate,
      dto.tenureMonths,
      new Date(),
      userId,
    );

    this.logger.log(
      `The repayment schedule rows were prepared successfully. Total installments: ${scheduleRows.length}`,
    );

    // Takes EMI from the first generated installment row
    const emi = this.toNumber(scheduleRows[0]?.installment_amount);

    // Replaces the old schedule and updates approved EMI in one transaction
    await this.prisma.$transaction(async (tx) => {
      this.logger.log('The repayment schedule update transaction has started.');

      // Clears any earlier generated schedule for the application
      await tx.repayment_schedule.deleteMany({
        where: {
          application_id: application.application_id,
        },
      });

      this.logger.log('Any earlier repayment schedule rows were cleared successfully.');

      // Inserts the newly generated repayment schedule rows
      await tx.repayment_schedule.createMany({
        data: scheduleRows,
      });

      this.logger.log('The new repayment schedule rows were saved successfully.');

      // Saves the approved EMI back to the loan application
      await tx.loan_application.update({
        where: {
          application_id: application.application_id,
        },
        data: {
          approved_emi: emi,
          updated_by: userId,
        },
      });

      this.logger.log('The approved EMI was updated successfully in the loan application.');
    });

    this.logger.log('The repayment schedule generation process was completed successfully.');

    return {
      message: 'Repayment Schedule calculated successfully',
      applicationNumber: application.application_number,
      applicationId: application.application_id,
      emi: this.round(emi, 2),
    };
  }

  /**
   * Builds all monthly payment rows for the full loan tenure
   *
   * @param applicationId - The ID of the loan application
   * @param principal - The total approved loan amount
   * @param annualRate - The annual interest rate of the loan
   * @param tenureMonths - The total payment duration in months
   * @param startDate - The date of the first installment
   * @param createdBy - The ID of the user who created the payment schedule
   * @returns An array of repayment schedule rows
   */
  private buildRepaymentSchedule(
    applicationId: string,
    principal: number,
    annualRate: number,
    tenureMonths: number,
    startDate: Date,
    createdBy: string,
  ) {
    // Converts yearly interest rate into monthly rate
    const monthlyRate = annualRate / 12 / 100;

    // Calculates EMI using standard loan formula, or simple division for zero interest
    const emi =
      monthlyRate === 0
        ? principal / tenureMonths
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    // Starts the first installment with full principal as opening balance
    let openingBalance = principal;

    return Array.from({ length: tenureMonths }, (_, index) => {
      const installmentNumber = index + 1;

      // Interest part for the current month
      const interestComponent = this.round(openingBalance * monthlyRate, 2);

      // Principal part after subtracting interest from EMI
      const principalComponent = this.round(emi - interestComponent, 2);

      // Final installment amount for the row
      const installmentAmount = this.round(principalComponent + interestComponent, 2);

      // Remaining balance after current installment
      const closingBalance =
        installmentNumber === tenureMonths ? 0 : this.round(openingBalance - principalComponent, 2);

      const row = {
        application_id: applicationId,
        installment_number: installmentNumber,
        due_date: this.addMonths(startDate, index + 1),
        opening_balance: openingBalance.toFixed(2),
        principal_component: principalComponent.toFixed(2),
        interest_component: interestComponent.toFixed(2),
        installment_amount: installmentAmount.toFixed(2),
        closing_balance: closingBalance.toFixed(2),
        paid_amount: '0.00',
        payment_status: 'PENDING',
        created_by: createdBy,
        updated_by: createdBy,
        is_active: true,
      };

      // Next row starts with the current closing balance
      openingBalance = closingBalance;

      return row;
    });
  }
  /**
   * Adds the given number of months to a date
   *
   * @param date - The base date to add months to
   * @param months - The number of months to add
   * @returns A new date object with the added months
   */
  private addMonths(date: Date, months: number): Date {
    // Creates a copy so the original date stays unchanged
    const result = new Date(date);

    // Moves the copied date forward by the required months
    // This method adjusts the date if the month exceeds the year boundary
    result.setMonth(result.getMonth() + months);

    return result;
  }

  /**
   * Rounds a number to the required decimal places
   *
   * @param value - The number to round
   * @param decimals - The number of decimal places to round to (default is 2)
   * @returns The rounded number
   */
  private round(value: number, decimals = 2): number {
    // Creates a factor to multiply the value with before rounding
    const factor = 10 ** decimals;

    // Rounds the value to the nearest integer
    return Math.round(value * factor) / factor;
  }

  /**
   * Safely converts unknown input into a usable number
   *
   * This method provides a way to convert unknown input values into a usable number.
   * It handles cases such as null, undefined, numeric strings, bigint values, and objects that wrap numeric values.
   * If the conversion is not possible, it returns 0.
   *
   * @param value - The value to convert
   * @returns A number value if the conversion is successful, or 0 if not
   */
  private toNumber(value: unknown): number {
    // Returns zero when the value is missing
    if (value === null || value === undefined) {
      return 0;
    }

    // Returns the value directly when it is already a number
    if (typeof value === 'number') {
      return value;
    }

    // Converts bigint values into number
    if (typeof value === 'bigint') {
      return Number(value);
    }

    // Converts numeric strings into number
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    // Handles objects that may wrap numeric values
    if (typeof value === 'object') {
      // Uses custom toNumber method if available
      if ('toNumber' in value && typeof value.toNumber === 'function') {
        const parsed = Number(value.toNumber());
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      // Falls back to valueOf when possible
      if ('valueOf' in value && typeof value.valueOf === 'function') {
        const primitive = value.valueOf();

        if (primitive !== value) {
          return this.toNumber(primitive);
        }
      }
    }

    // Returns zero when conversion is not possible
    return 0;
  }
}
