import { IsNotEmpty, IsString, Matches } from 'class-validator';

// This DTO is used to validate the request for fetching a credit score.
export class FetchCreditScoreRequestDto {
  // This field stores the application number entered by the user.
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must be in format APPL0000000001.',
  })
  applicationNumber?: string;
}
