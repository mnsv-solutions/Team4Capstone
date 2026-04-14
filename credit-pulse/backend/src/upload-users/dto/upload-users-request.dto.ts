import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UploadUserExcelRowRequestDto {
  // Normalizes the role value and allows only supported system roles
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsIn(['ADMIN', 'SOURCING_OFFICER', 'UNDERWRITER', 'DISBURSAL_OFFICER', 'CUSTOMER'])
  role_code: string;

  // Stores the user's first name after trimming extra spaces
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => String(value).trim())
  @Matches(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/, {
    message: 'first_name must contain only letters.',
  })
  first_name: string;

  // Stores the user's last name with basic name validation
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => String(value).trim())
  @Matches(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/, {
    message: 'last_name must contain only letters.',
  })
  last_name: string;

  // Cleans and validates the email in lowercase format
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email: string;

  // Accepts phone numbers with digits and common phone symbols
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim())
  @Matches(/^\+?[0-9()\-\s]{10,20}$/, {
    message: 'phone format is invalid.',
  })
  phone: string;

  // Expects date of birth in simple YYYY-MM-DD format
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim())
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date_of_birth must be in YYYY-MM-DD format.',
  })
  date_of_birth: string;

  // Normalizes gender text into proper case before validation
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    const text = String(value).trim().toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  })
  @IsIn(['Male', 'Female', 'Other'])
  gender: string;

  // Normalizes marital status value before checking allowed options
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    const text = String(value).trim().toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  })
  @IsIn(['Single', 'Married', 'Divorced'])
  marital_status: string;

  // Keeps nationality clean and limited to alphabetic words
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim())
  @Matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/, {
    message: 'nationality must contain only letters.',
  })
  nationality: string;

  // Only SIN is allowed as the government id type here
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsIn(['SIN'])
  government_id_type: string;

  // Stores the last 4 digits style government id value
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim())
  @Matches(/^\d{4}$/, {
    message: 'government_id_number must contain exactly 4 digits.',
  })
  government_id_number: string;

  // Tells whether the uploaded person should be treated as a system user
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsBooleanString()
  is_system_user: string;
}
