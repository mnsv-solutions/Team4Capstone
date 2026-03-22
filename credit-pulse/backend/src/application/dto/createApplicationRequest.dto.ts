import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPostalCode,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateApplicationRequestDto {
  @IsString({ message: 'First Name must be a string.' })
  @IsNotEmpty({ message: 'First Name is required.' })
  firstName: string;

  @IsString({ message: 'Last Name must be a string.' })
  @IsNotEmpty({ message: 'Last Name is required.' })
  lastName: string;

  @IsNotEmpty({ message: 'DOB is required.' })
  @IsDateString({}, { message: 'DOB must be a valid date (YYYY-MM-DD).' })
  dob: string;

  @IsString({ message: 'Gender must be a string.' })
  @IsNotEmpty({ message: 'Gender is required.' })
  gender: string;

  @IsString({ message: 'Marital Status must be a string.' })
  @IsNotEmpty({ message: 'Marital Status is required.' })
  maritalStatus: string;

  @IsString({ message: 'Government ID Number must be a string.' })
  @IsNotEmpty({ message: 'Government ID Number is required.' })
  governmentIdNumber: string;

  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @IsString({ message: 'Mobile must be a string.' })
  @IsNotEmpty({ message: 'Mobile is required.' })
  mobile: string;

  @IsString({ message: 'Address must be a string.' })
  @IsNotEmpty({ message: 'Address is required.' })
  address: string;

  @IsString({ message: 'City must be a string.' })
  @IsNotEmpty({ message: 'City is required.' })
  city: string;

  @IsPostalCode('any', { message: 'Postal Code must be a valid postal code.' })
  @IsNotEmpty({ message: 'Postal Code is required.' })
  postalCode: string;

  @IsString({ message: 'Highest Education must be a string.' })
  @IsNotEmpty({ message: 'Highest Education is required.' })
  highestEducation: string;

  @IsString({ message: 'Institution must be a string.' })
  @IsNotEmpty({ message: 'Institution is required.' })
  institution: string;

  @IsInt({ message: 'Graduation Year must be an integer.' })
  @Min(1900, { message: 'Graduation Year must be at least 1900.' })
  @Max(2100, { message: 'Graduation Year cannot be greater than 2100.' })
  graduationYear: number;

  @IsString({ message: 'Employment Status must be a string.' })
  @IsNotEmpty({ message: 'Employment Status is required.' })
  employmentStatus: string;

  @IsString({ message: 'Employer Name must be a string.' })
  @IsNotEmpty({ message: 'Employer Name is required.' })
  employerName: string;

  @IsNumber({}, { message: 'Monthly Income must be a valid number.' })
  monthlyIncome: number;

  @IsNumber({}, { message: 'Existing Loans must be a valid number.' })
  existingLoans: number;

  @IsString({ message: 'Upload Government ID must be a string.' })
  @IsNotEmpty({ message: 'Upload Government ID is required.' })
  uploadGovernmentId: string;

  @IsString({ message: 'Upload Pay Slip must be a string.' })
  @IsNotEmpty({ message: 'Upload Pay Slip is required.' })
  uploadPaySlip: string;

  @IsString({ message: 'Upload Bank Statement must be a string.' })
  @IsNotEmpty({ message: 'Upload Bank Statement is required.' })
  uploadBankStatement: string;
}
