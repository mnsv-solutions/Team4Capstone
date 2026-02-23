import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

import { IsAdult } from '../../../src/common/validators/is-adult.validator.js';

/**
 * Application Status DTO
 *
 * @export
 * @class ApplicationStatusDto
 */
export class ApplicationStatusDto {
  /**
   * Application Number
   *
   * @memberof ApplicationStatusDto
   * @property {string} applicationNumber - Application Number
   * @property {string} applicationNumber.message - Application Number must be a string.
   * @property {string} applicationNumber.message - Application Number is required.
   * @property {string} applicationNumber.message - Application Number must start with APPL followed by exactly 10 digits
   */
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must start with APPL followed by exactly 10 digits',
  })
  applicationNumber: string;

  /**
   * Date of Birth
   *
   * @memberof ApplicationStatusDto
   * @property {string} dob - Date of Birth
   * @property {string} dob.message - Date of Birth is required.
   * @property {string} dob.message - Date of Birth must be a valid date (YYYY-MM-DD)
   * @property {string} dob.message - Applicant must be at least 18 years old
   */
  @IsNotEmpty({ message: 'Date of Birth is required.' })
  @IsDateString({}, { message: 'Date of Birth must be a valid date (YYYY-MM-DD)' })
  @IsAdult()
  dob: string;
}
