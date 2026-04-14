import { FailedEligibilityRuleDto } from './failed-eligibility-rule.dto.js';

/**
 * Response of calculating eligibility
 *
 * @property {string} applicationNumber - Application number for which eligibility was checked
 * @property {string} ruleSetCode - Code of the rule set used during evaluation
 * @property {number} ruleSetVersion - Version number of the applied rule set
 * @property {'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_ELIGIBLE'} eligibilityStatus - Final eligibility result after checking all rules
 * @property {string} message - Main response message for the eligibility result
 * @property {number} failedRuleCount - Total number of rules that failed
 * @property {string} reasons - Simple list of reasons explaining why eligibility failed or became conditional
 * @property {FailedEligibilityRuleDto[]} failedRules - Detailed list of failed rules with extra rule-level information
 * @property {Record<string, number | string | null} metrics - Calculated values used while evaluating eligibility
 * @property {string} calculatedAt - Date and time when eligibility was calculated
 */
export class CalculateEligibilityResponseDto {
  // Application number for which eligibility was checked
  applicationNumber?: string;

  // Code of the rule set used during evaluation
  ruleSetCode?: string;

  // Version number of the applied rule set
  ruleSetVersion?: number;

  // Final eligibility result after checking all rules
  eligibilityStatus?: 'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_ELIGIBLE';

  // Main response message for the eligibility result
  message?: string;

  // Total number of rules that failed
  failedRuleCount?: number;

  // Simple list of reasons explaining why eligibility failed or became conditional
  reasons?: string[];

  // Detailed list of failed rules with extra rule-level information
  failedRules?: FailedEligibilityRuleDto[];

  // Calculated values used while evaluating eligibility
  metrics?: Record<string, number | string | null>;

  // Date and time when eligibility was calculated
  calculatedAt?: string;
}
