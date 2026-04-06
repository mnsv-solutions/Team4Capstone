/**
 * DTO containing information about a rule that failed during eligibility evaluation
 *
 * @property {string} ruleCode - Unique code of the rule that failed
 * @property {string} ruleName - Display name of the failed rule
 * @property {string} metricName - Name of the metric checked by this rule
 * @property {string} severity - Severity level of the failed rule
 * @property {string} operator - Comparison operator used in the rule, such as <, >, or =
 * @property {number | string | null} currentValue - Actual value found during eligibility evaluation
 * @property {number | null} thresholdValue - Single threshold value used in the rule, if applicable
 * @property {number | null} thresholdMin - Minimum allowed value for range-based rules
 * @property {number | null} thresholdMax - Maximum allowed value for range-based rules
 * @property {string | null} expectedValue - Expected value for text-based or exact-match rules
 * @property {string} message - Clear explanation of why the rule failed
 */
export class FailedEligibilityRuleDto {
  // Unique code of the rule that failed
  ruleCode?: string;

  // Display name of the failed rule
  ruleName?: string;

  // Name of the metric checked by this rule
  metricName?: string;

  // Severity level of the failed rule
  severity?: string;

  // Comparison operator used in the rule, such as <, >, or =
  operator?: string;

  // Actual value found during eligibility evaluation
  currentValue?: number | string | null;

  // Single threshold value used in the rule, if applicable
  thresholdValue?: number | null;

  // Minimum allowed value for range-based rules
  thresholdMin?: number | null;

  // Maximum allowed value for range-based rules
  thresholdMax?: number | null;

  // Expected value for text-based or exact-match rules
  expectedValue?: string | null;

  // Clear explanation of why the rule failed
  message?: string;
}
