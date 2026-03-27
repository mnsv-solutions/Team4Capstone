import { IsBoolean, IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

import { IsAdult } from '../../common/validators/is-adult.validator.js';

/**
 * DTO for Credit Score Check Request
 *
 * @property {string} applicationNumber - Unique application number sent from the loan application flow
 * @property {string} sin - Applicant SIN, stored as a 9 digit value
 * @property {string} dateOfBirth - Date of birth used to confirm age eligibility
 * @property {string} firstName - Applicant first name for identity matching
 * @property {string} lastName - Applicant last name for identity matching
 * @property {boolean} consent - Must be true or false to confirm permission was provided
 */
export class CreditScoreCheckRequestDto {
  // Unique application number sent from the loan application flow
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must be in format APPL0000000001.',
  })
  applicationNumber: string;

  // Applicant SIN, stored as a 9 digit value, for identity matching
  @IsString({ message: 'SIN must be a string.' })
  @IsNotEmpty({ message: 'SIN is required.' })
  @Matches(/^\d{9}$/, {
    message: 'SIN must be a valid 9 digit number.',
  })
  sin: string;

  // Date of birth for identity matching
  @IsNotEmpty({ message: 'Date of Birth is required.' })
  @IsDateString({}, { message: 'Date of Birth must be a valid date (YYYY-MM-DD).' })
  @IsAdult()
  dateOfBirth: string;

  // Applicant first name for identity matching
  @IsString({ message: 'First Name must be a string.' })
  @IsNotEmpty({ message: 'First Name is required.' })
  firstName: string;

  // Applicant last name for identity matching
  @IsString({ message: 'Last Name must be a string.' })
  @IsNotEmpty({ message: 'Last Name is required.' })
  lastName: string;

  // Must be true or false to confirm permission was provided
  @IsNotEmpty({ message: 'Consent is required.' })
  @IsBoolean({ message: 'Consent must be either true or false.' })
  consent: boolean;
}
