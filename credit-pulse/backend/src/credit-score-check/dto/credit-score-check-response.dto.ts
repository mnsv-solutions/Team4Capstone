/**
 * DTO representing the response of a credit score check.
 *
 * @property {string} credit_check_id - The ID of the credit score check.
 * @property {string} application_id - The ID of the application.
 * @property {string | null} cibil_report_id - The ID of the CIBIL report.
 * @property {string | null} request_id - The ID of the request.
 * @property {string} bureau_name - The name of the bureau.
 * @property {string | null} bureau_reference_id - The reference ID of the bureau.
 * @property {string} bureau_status - The status of the bureau.
 * @property {number | null} credit_score - The credit score.
 * @property {string | null} score_band - The score band.
 * @property {string | null} risk_level - The risk level.
 * @property {Date} checked_at - The date the credit score check was checked.
 * @property {string | null} checked_by - The user who checked the credit score check.
 * @property {string | null} remarks - The remarks of the credit score check.
 * @property {unknown | null} raw_response - The raw response of the credit score check.
 * @property {boolean} is_latest - Whether the credit score check is the latest.
 * @property {Date} created_at - The date the credit score check was created.
 * @property {Date} updated_at - The date the credit score check was updated.
 */

export class CreditScoreCheckResponseDto {
  credit_check_id: string;
  application_id: string;
  cibil_report_id: string | null;
  request_id: string | null;
  bureau_name: string;
  bureau_reference_id: string | null;
  bureau_status: string;
  credit_score: number | null;
  score_band: string | null;
  risk_level: string | null;
  checked_at: Date;
  checked_by: string | null;
  remarks: string | null;
  raw_response: unknown | null;
  is_latest: boolean;
  created_at: Date;
  updated_at: Date;
}
