import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetPersonalInformationRequestDto {
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must be in format APPL0000000001.',
  })
  applicationNumber: string;
}
