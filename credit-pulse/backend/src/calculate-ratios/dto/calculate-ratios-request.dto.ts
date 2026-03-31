import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CalculateRatiosRequestDto {
  /**
   * Application Number must be a string.
   * It must also start with APPL followed by exactly 10 digits.
   */
  @IsString({ message: 'Application Number must be a string.' })
  /**
   * Application Number is required.
   * It must also be a valid application number.
   */
  @IsNotEmpty({ message: 'Application Number is required.' })
  /**
   * Application Number must match the format APPL followed by 10 digits.
   */
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must start with APPL followed by exactly 10 digits',
  })
  applicationNumber: string;
}
