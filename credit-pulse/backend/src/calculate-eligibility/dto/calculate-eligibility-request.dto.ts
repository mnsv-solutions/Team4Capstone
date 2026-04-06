import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * DTO for calculating eligibility
 *
 * @property {string} applicationNumber - Application number used to find the loan application
 * This value must start with APPL followed by exactly 10 digits.
 */
export class CalculateEligibilityRequestDto {
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must start with APPL followed by exactly 10 digits.',
  })
  applicationNumber?: string;
}
