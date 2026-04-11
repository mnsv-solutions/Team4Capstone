import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class AddressDto {
  @IsString({ message: 'Line 1 must be a string.' })
  @IsNotEmpty({ message: 'Line 1 is required.' })
  line1: string;

  @IsOptional()
  @IsString({ message: 'Line 2 must be a string.' })
  line2?: string;

  @IsString({ message: 'City must be a string.' })
  @IsNotEmpty({ message: 'City is required.' })
  city: string;

  @IsString({ message: 'State must be a string.' })
  @IsNotEmpty({ message: 'State is required.' })
  state: string;

  @IsString({ message: 'Postal Code must be a string.' })
  @IsNotEmpty({ message: 'Postal Code is required.' })
  postalCode: string;

  @IsString({ message: 'Country must be a string.' })
  @IsNotEmpty({ message: 'Country is required.' })
  country: string;
}

export class BankAccountDto {
  @IsString({ message: 'Bank Name must be a string.' })
  @IsNotEmpty({ message: 'Bank Name is required.' })
  bankName: string;

  @IsString({ message: 'Institution Number must be a string.' })
  @IsNotEmpty({ message: 'Institution Number is required.' })
  institutionNumber: string;

  @IsString({ message: 'Transit Number must be a string.' })
  @IsNotEmpty({ message: 'Transit Number is required.' })
  transitNumber: string;

  @IsString({ message: 'Account Number must be a string.' })
  @IsNotEmpty({ message: 'Account Number is required.' })
  accountNumber: string;

  @IsString({ message: 'Account Type must be a string.' })
  @IsNotEmpty({ message: 'Account Type is required.' })
  accountType: string;

  @IsOptional()
  @IsString({ message: 'SWIFT BIC must be a string.' })
  swiftBic?: string;

  @IsBoolean({ message: 'isRepaymentAccount must be a boolean.' })
  isRepaymentAccount: boolean;
}

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

  @IsString({ message: 'Nationality must be a string.' })
  @IsNotEmpty({ message: 'Nationality is required.' })
  nationality: string;

  @IsString({ message: 'Government ID Type must be a string.' })
  @IsNotEmpty({ message: 'Government ID Type is required.' })
  governmentIdType: string;

  @IsString({ message: 'Government ID Number must be a string.' })
  @IsNotEmpty({ message: 'Government ID Number is required.' })
  governmentIdNumber: string;

  @IsString({ message: 'SIN/Tax ID must be a string.' })
  @IsNotEmpty({ message: 'SIN/Tax ID is required.' })
  sinTaxId: string;

  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @IsString({ message: 'Mobile must be a string.' })
  @IsNotEmpty({ message: 'Mobile is required.' })
  mobile: string;

  @IsOptional()
  @IsString({ message: 'Alternate Phone must be a string.' })
  alternatePhone?: string;

  @IsBoolean({ message: 'Mailing Same As Residential must be a boolean.' })
  mailingSameAsResidential: boolean;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty({ message: 'Residential Address is required.' })
  residentialAddress: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty({ message: 'Mailing Address is required.' })
  mailingAddress: AddressDto;

  @IsString({ message: 'Highest Education must be a string.' })
  @IsNotEmpty({ message: 'Highest Education is required.' })
  highestEducation: string;

  @IsString({ message: 'Field of Study must be a string.' })
  @IsNotEmpty({ message: 'Field of Study is required.' })
  fieldOfStudy: string;

  @IsString({ message: 'Institution Name must be a string.' })
  @IsNotEmpty({ message: 'Institution Name is required.' })
  institutionName: string;

  @IsOptional()
  graduationYear: string | number;

  @IsString({ message: 'Employment Status must be a string.' })
  @IsNotEmpty({ message: 'Employment Status is required.' })
  employmentStatus: string;

  @ValidateIf((o) => o.employmentStatus === 'Employed')
  @IsString({ message: 'Employer Name must be a string.' })
  @IsNotEmpty({ message: 'Employer Name is required.' })
  employerName: string;

  @ValidateIf((o) => o.employmentStatus === 'Employed')
  @IsString({ message: 'Job Title must be a string.' })
  @IsNotEmpty({ message: 'Job Title is required.' })
  jobTitle: string;

  @IsOptional() workExperience: string | number;
  @IsOptional() monthlyIncome: string | number;
  @IsOptional() otherIncomeSources: string | number;
  @IsOptional() existingLoans: string | number;
  @IsOptional() totalMonthlyLoanPayments: string | number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankAccountDto)
  bankAccounts: BankAccountDto[];

  @IsOptional() governmentIdProof?: any;
  @IsOptional() incomeProof?: any;
  @IsOptional() bankStatement?: any;

  @IsBoolean() creditReportConsent: boolean;
  @IsBoolean() declarationAccepted: boolean;
}
