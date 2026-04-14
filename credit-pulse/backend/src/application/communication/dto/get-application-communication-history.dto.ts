import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/**
 * Trim string input
 *
 * This function takes an object with a single property 'value' which is the input string to be trimmed.
 * If the input value is a string, it trims the whitespace from the beginning and end of the string and returns the trimmed value.
 * If the input value is not a string, it returns the original value unchanged.
 */
const trimString = ({ value }: { value: unknown }): string | unknown => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};

/**
 * Converts an optional boolean input to a boolean or undefined value.
 *
 * This function takes an object with a single property 'value' which is the input to be converted.
 * If the input value is an empty string, null, or undefined, the function returns undefined.
 * If the input value is true or 'true', the function returns true.
 * If the input value is false or 'false', the function returns false.
 * If the input value is anything else, the function returns the original value unchanged.
 *
 * The purpose of this function is to allow optional boolean fields in DTOs to be properly validated.
 */
const toOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
};
// Get Application Communication History DTO
export class GetApplicationCommunicationHistoryDto {
  /**
   * Application Number
   *
   * @memberof GetApplicationCommunicationHistoryDto
   * @property {string} applicationNumber - Application Number
   * @property {string} applicationNumber.message - Application Number must be a string.
   * @property {string} applicationNumber.message - Application Number is required.
   * @property {string} applicationNumber.message - Application Number must start with APPL followed by exactly 10 digits
   */
  @Transform(trimString)
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must start with APPL followed by exactly 10 digits',
  })
  applicationNumber: string;

  /**
   * Internal Communication Flag
   *
   * @memberof GetApplicationCommunicationHistoryDto
   * @property {boolean} isInternal - Internal communication filter
   * @property {string} isInternal.message - isInternal must be a boolean value
   */
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean({ message: 'isInternal must be a boolean value' })
  isInternal?: boolean;
}
