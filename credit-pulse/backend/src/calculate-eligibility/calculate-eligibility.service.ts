import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CalculateEligibilityRequestDto } from './dto/calculate-eligibility-request.dto.js';
import { CalculateEligibilityResponseDto } from './dto/calculate-eligibility-response.dto.js';
import { FailedEligibilityRuleDto } from './dto/failed-eligibility-rule.dto.js';

type MetricValue = number | string | null;

type MetricsMap = Record<string, MetricValue>;

type EligibilityRuleRecord = {
  // Unique code used to identify the rule
  rule_code: string;

  // Display name of the rule
  rule_name: string;

  // Name of the metric that this rule checks
  metric_name: string;

  // Comparison operator used for evaluation
  operator: string;

  // Single threshold value used by the rule when applicable
  threshold_value: unknown;

  // Minimum allowed value for range-based rules
  threshold_min: unknown;

  // Maximum allowed value for range-based rules
  threshold_max: unknown;

  // Expected text value used for exact-match type rules
  expected_value: string | null;

  // Severity of the rule failure, such as HARD_FAIL or SOFT_FAIL
  severity: string;

  // Default failure message shown when the rule does not pass
  failure_message: string;

  // Optional message template that can include dynamic values
  failure_message_template?: string | null;
};

@Injectable()
export class CalculateEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates eligibility for a given loan application.
   * The function takes in the request body, which should contain the necessary information
   * for calculating the eligibility. It then takes in the request object, which should contain the
   * authenticated user.
   * The function first extracts the user ID from the request object. If the user ID is not present,
   * it throws an UnauthorizedException, as the user is not authenticated.
   * If the user ID is present, the function then calls the calculateEligibility function of the
   * CalculateEligibilityService, passing in the request body and user ID. The result of this function call
   * is then returned as a promise.
   * @param dto - The request body containing the calculate eligibility request.
   * @param userId - The authenticated user ID.
   * @returns A promise that resolves to the calculate eligibility response.
   */
  async calculateEligibility(
    dto: CalculateEligibilityRequestDto,
    userId: string,
  ): Promise<CalculateEligibilityResponseDto> {
    // Keep one common timestamp for this full eligibility calculation
    const now = new Date();

    // Find the active loan application using the application number
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: dto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
        tenure_months: true,
      },
    });

    // Stop if the application does not exist
    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    // Get the latest active ratio summary for this application
    const ratioSummary = await this.prisma.application_ratio_summary.findFirst({
      where: {
        application_id: application.application_id,
        is_active: true,
      },
      orderBy: {
        calculated_at: 'desc',
      },
    });

    // Ratios must be calculated before eligibility can be checked
    if (!ratioSummary) {
      throw new BadRequestException('Ratio summary not found. Please calculate ratios first.');
    }

    // Get the latest credit check result for this application
    const creditCheck = await this.prisma.application_credit_check.findFirst({
      where: {
        application_id: application.application_id,
        is_latest: true,
      },
      orderBy: {
        checked_at: 'desc',
      },
    });

    // Credit score check must be completed before eligibility can be checked
    if (!creditCheck) {
      throw new BadRequestException(
        'Credit score not found. Please complete credit score check first.',
      );
    }

    // Load the primary applicant so age-based rules can be evaluated
    const primaryApplicant = await this.prisma.sub_loan.findFirst({
      where: {
        application_id: application.application_id,
        applicant_type: 0,
        is_active: true,
      },
      include: {
        customer: {
          select: {
            date_of_birth: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Pull important numeric values from the ratio summary
    const monthlyIncome = Number(ratioSummary.monthly_income ?? 0);
    const totalMonthlyDebtPayments = Number(ratioSummary.total_monthly_debt_payments ?? 0);
    const proposedEmi = Number(ratioSummary.proposed_emi ?? 0);

    // Calculate how much income is left after debts and EMI
    const netSurplusAfterEmi = this.round(monthlyIncome - totalMonthlyDebtPayments - proposedEmi);

    // Estimate applicant age at loan maturity when date of birth and tenure are available
    const ageAtMaturity =
      primaryApplicant?.customer?.date_of_birth && application.tenure_months
        ? this.calculateAgeAtMaturity(
            primaryApplicant.customer.date_of_birth,
            application.tenure_months,
          )
        : null;

    // Prepare all values that will be checked against the active rule set
    const metrics: MetricsMap = {
      credit_score:
        creditCheck.credit_score !== null && creditCheck.credit_score !== undefined
          ? Number(creditCheck.credit_score)
          : null,
      dbr: Number(ratioSummary.dbr ?? 0),
      emi_to_income: Number(ratioSummary.emi_to_income ?? 0),
      credit_utilization: Number(ratioSummary.credit_utilization ?? 0),
      loan_to_income: Number(ratioSummary.loan_to_income ?? 0),
      bureau_status: creditCheck.bureau_status ?? null,
      risk_level: creditCheck.risk_level ?? null,
      monthly_income: monthlyIncome,
      net_surplus_after_emi: netSurplusAfterEmi,
      age_at_maturity: ageAtMaturity,
    };

    // Get the currently active eligibility rule set based on date and active flag
    const activeRuleSet = await this.prisma.eligibility_rule_set.findFirst({
      where: {
        is_active: true,
        OR: [{ effective_from: null }, { effective_from: { lte: now } }],
        AND: [{ OR: [{ effective_to: null }, { effective_to: { gte: now } }] }],
      },
      orderBy: [{ version_no: 'desc' }, { created_at: 'desc' }],
    });

    // Stop if no active rule set is available
    if (!activeRuleSet) {
      throw new NotFoundException('Active eligibility rule set not found.');
    }

    // Get all active rules for the selected rule set in evaluation order
    const rules = await this.prisma.eligibility_rule.findMany({
      where: {
        rule_set_id: activeRuleSet.rule_set_id,
        is_active: true,
      },
      orderBy: [{ evaluation_order: 'asc' }, { created_at: 'asc' }],
    });

    // Stop if the rule set exists but has no active rules
    if (rules.length === 0) {
      throw new NotFoundException('Active eligibility rules not found.');
    }

    // This will store every rule that fails during evaluation
    const failedRules: FailedEligibilityRuleDto[] = [];

    // Check each rule one by one against the prepared metric values
    for (const rule of rules) {
      const typedRule = rule as EligibilityRuleRecord;
      const actualValue = metrics[typedRule.metric_name] ?? null;
      const passed = this.evaluateRule(typedRule, actualValue);

      // If a rule fails, collect all useful details for the response
      if (!passed) {
        const thresholdValue =
          typedRule.threshold_value !== null && typedRule.threshold_value !== undefined
            ? Number(typedRule.threshold_value)
            : null;

        const thresholdMin =
          typedRule.threshold_min !== null && typedRule.threshold_min !== undefined
            ? Number(typedRule.threshold_min)
            : null;

        const thresholdMax =
          typedRule.threshold_max !== null && typedRule.threshold_max !== undefined
            ? Number(typedRule.threshold_max)
            : null;

        failedRules.push({
          ruleCode: typedRule.rule_code,
          ruleName: typedRule.rule_name,
          metricName: typedRule.metric_name,
          severity: typedRule.severity,
          operator: typedRule.operator,
          currentValue: actualValue,
          thresholdValue,
          thresholdMin,
          thresholdMax,
          expectedValue: typedRule.expected_value ?? null,
          message: this.buildRuleMessage(typedRule, actualValue),
        });
      }
    }

    // Collect only clean, non-empty failure messages for summary display
    const reasonMessages = failedRules
      .map((rule) => rule.message)
      .filter(
        (message): message is string => typeof message === 'string' && message.trim().length > 0,
      );

    // Count hard fails and soft fails separately
    const hardFailCount = failedRules.filter((rule) => rule.severity === 'HARD_FAIL').length;
    const softFailCount = failedRules.filter((rule) => rule.severity === 'SOFT_FAIL').length;

    // Start with the assumption that the applicant is eligible
    let eligibilityStatus: 'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_ELIGIBLE' = 'ELIGIBLE';
    let message = 'Applicant is eligible as per the active rule set.';

    // Hard fails make the application not eligible
    if (hardFailCount > 0) {
      eligibilityStatus = 'NOT_ELIGIBLE';
      message = `Applicant is not eligible as per the active rule set. Hard fails: ${hardFailCount}. Soft fails: ${softFailCount}.`;
    }
    // Soft fails without hard fails make the application conditionally eligible
    else if (softFailCount > 0) {
      eligibilityStatus = 'CONDITIONALLY_ELIGIBLE';
      message = `Applicant is conditionally eligible as per the active rule set. Soft fails: ${softFailCount}.`;
    }

    // Save the latest eligibility decision and deactivate any earlier active summary for the same rule set
    await this.prisma.$transaction(async (tx) => {
      await tx.application_eligibility_summary.updateMany({
        where: {
          application_id: application.application_id,
          rule_set_id: activeRuleSet.rule_set_id,
          is_active: true,
        },
        data: {
          is_active: false,
          updated_by: userId,
        },
      });

      await tx.application_eligibility_summary.create({
        data: {
          application_id: application.application_id,
          application_number: application.application_number,
          rule_set_id: activeRuleSet.rule_set_id,
          eligibility_status: eligibilityStatus,
          failed_rule_count: failedRules.length,
          reason_json: reasonMessages,
          decision_snapshot_json: metrics,
          calculated_at: now,
          created_by: userId,
          updated_by: userId,
          is_active: true,
        },
      });
    });

    // Return the full eligibility result to the caller
    return {
      applicationNumber: application.application_number,
      ruleSetCode: activeRuleSet.rule_set_code,
      ruleSetVersion: activeRuleSet.version_no,
      eligibilityStatus,
      message,
      failedRuleCount: failedRules.length,
      reasons: reasonMessages,
      failedRules,
      metrics,
      calculatedAt: now.toISOString(),
    };
  }

  /**
   * Evaluates a rule and returns a boolean indicating whether the rule passed or failed.
   * The evaluation is based on the operator and threshold value of the rule.
   * If the actual value is null or undefined, the rule is considered to have failed.
   *
   * @param rule - The rule to be evaluated.
   * @param actualValue - The actual value of the metric that was evaluated.
   * @returns A boolean indicating whether the rule passed or failed.
   */
  private evaluateRule(rule: EligibilityRuleRecord, actualValue: MetricValue): boolean {
    // If the actual value is null or undefined, the rule is considered to have failed
    if (actualValue === null || actualValue === undefined) {
      return false;
    }

    // If the rule is a BETWEEN type, evaluate it as such
    if (rule.operator === 'BETWEEN') {
      const numericActual = Number(actualValue);
      const min = Number(rule.threshold_min ?? 0);
      const max = Number(rule.threshold_max ?? 0);
      return numericActual >= min && numericActual <= max;
    }

    // If the rule has an expected value, evaluate it as such
    if (rule.expected_value !== null && rule.expected_value !== undefined) {
      const actualString = String(actualValue);
      const expectedString = String(rule.expected_value);

      switch (rule.operator) {
        case '=':
          return actualString === expectedString;
        case '!=':
          return actualString !== expectedString;
        default:
          return false;
      }
    }

    // If the rule has a threshold value, evaluate it as such
    const numericActual = Number(actualValue);
    const thresholdValue = Number(rule.threshold_value ?? 0);

    switch (rule.operator) {
      case '>':
        return numericActual > thresholdValue;
      case '>=':
        return numericActual >= thresholdValue;
      case '<':
        return numericActual < thresholdValue;
      case '<=':
        return numericActual <= thresholdValue;
      case '=':
        return numericActual === thresholdValue;
      case '!=':
        return numericActual !== thresholdValue;
      default:
        return false;
    }
  }
  /**
   * Builds a rule message based on the template provided in the rule.
   * The message is constructed by replacing placeholders with actual values.
   *
   * @param rule - The rule for which the message is being built.
   * @param currentValue - The actual value of the metric that was evaluated.
   * @returns A string containing the built message.
   */
  private buildRuleMessage(rule: EligibilityRuleRecord, currentValue: MetricValue): string {
    // The template is constructed from the rule's failure message template and/or the rule's failure message
    const template = rule.failure_message_template?.trim() || rule.failure_message;

    // Replace placeholders with actual values
    return template
      .replaceAll('{{currentValue}}', this.stringifyValue(currentValue))
      .replaceAll('{{thresholdValue}}', this.stringifyValue(rule.threshold_value))
      .replaceAll('{{thresholdMin}}', this.stringifyValue(rule.threshold_min))
      .replaceAll('{{thresholdMax}}', this.stringifyValue(rule.threshold_max))
      .replaceAll('{{expectedValue}}', this.stringifyValue(rule.expected_value))
      .replaceAll('{{operator}}', this.stringifyValue(rule.operator))
      .replaceAll('{{metricName}}', this.stringifyValue(rule.metric_name));
  }

  /**
   * Stringifies a value into a string. This method is used to display values in rule messages.
   *
   * @param value - The value to stringify.
   * @returns A string representation of the value.
   */
  private stringifyValue(value: unknown): string {
    //If the value is null or undefined, returns 'N/A'.
    if (value === null || value === undefined) {
      return 'N/A';
    }

    // If the value is a string, returns the value unchanged.
    if (typeof value === 'string') {
      return value;
    }

    // If the value is a number, boolean, or bigint, returns the value as a string.
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return value.toString();
    }

    // If the value is a date, returns the ISO string representation of the date.
    if (value instanceof Date) {
      return value.toISOString();
    }

    // If the value is an array, stringifies each item in the array and joins them with commas.
    if (Array.isArray(value)) {
      return value.map((item) => this.stringifyValue(item)).join(', ');
    }

    // If the value is an object, stringifies the object using JSON.stringify.
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    //If the value is of any other type, returns 'N/A'.
    return 'N/A';
  }

  /**
   * Calculates the age of the applicant at the maturity date.
   *
   * @param dateOfBirth - The date of birth of the applicant.
   * @param tenureMonths - The tenure period in months.
   * @returns The age of the applicant at the maturity date.
   */
  private calculateAgeAtMaturity(dateOfBirth: Date, tenureMonths: number): number {
    const today = new Date();
    const maturityDate = new Date(today);
    maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

    // Calculate the age of the applicant at the maturity date
    let age = maturityDate.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = maturityDate.getMonth() - dateOfBirth.getMonth();

    // Adjust the age if the maturity date is before the applicant's birthday this year
    if (monthDiff < 0 || (monthDiff === 0 && maturityDate.getDate() < dateOfBirth.getDate())) {
      age -= 1;
    }

    return age;
  }

  /**
   * Rounds a given number to the nearest two decimal places.
   *
   * @param value - The number to round.
   * @returns The rounded number.
   */
  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
