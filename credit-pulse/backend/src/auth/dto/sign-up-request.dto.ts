import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// This helper trims the text and replaces multiple spaces with a single space.
const trimAndCollapseSpaces = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

// This helper trims the email and converts it to lowercase.
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// This helper trims the phone number and removes unwanted characters.
const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/[^\d+]/g, '') : value;

// This DTO is used to validate the sign-up request data.
export class SignUpRequestDto {
  // This trims and cleans the first name before validation.
  @Transform(trimAndCollapseSpaces)

  // This makes sure the first name is a string.
  @IsString({ message: 'First Name must be a string.' })

  // This makes sure the first name is not empty.
  @IsNotEmpty({ message: 'First Name is required.' })

  // This makes sure the first name has at least 2 characters.
  @MinLength(2, { message: 'First Name must be at least 2 characters long.' })

  // This makes sure the first name does not go over 100 characters.
  @MaxLength(100, { message: 'First Name must not exceed 100 characters.' })

  // This allows only letters, spaces, apostrophes, and hyphens in the first name.
  @Matches(/^[A-Za-z\s'-]+$/, {
    message: 'First Name can only contain letters, spaces, apostrophes, and hyphens.',
  })
  firstName: string;

  // This trims and cleans the last name before validation.
  @Transform(trimAndCollapseSpaces)

  // This makes sure the last name is a string.
  @IsString({ message: 'Last Name must be a string.' })

  // This makes sure the last name is not empty.
  @IsNotEmpty({ message: 'Last Name is required.' })

  // This makes sure the last name has at least 2 characters.
  @MinLength(2, { message: 'Last Name must be at least 2 characters long.' })

  // This makes sure the last name does not go over 100 characters.
  @MaxLength(100, { message: 'Last Name must not exceed 100 characters.' })

  // This allows only letters, spaces, apostrophes, and hyphens in the last name.
  @Matches(/^[A-Za-z\s'-]+$/, {
    message: 'Last Name can only contain letters, spaces, apostrophes, and hyphens.',
  })
  lastName: string;

  // This trims the email and changes it to lowercase before validation.
  @Transform(normalizeEmail)

  // This makes sure the email is not empty.
  @IsNotEmpty({ message: 'Email is required.' })

  // This makes sure the email is in a valid format.
  @IsEmail({}, { message: 'Email must be a valid email address.' })

  // This makes sure the email does not go over 255 characters.
  @MaxLength(255, { message: 'Email must not exceed 255 characters.' })
  email: string;

  // This cleans the phone number before validation.
  @Transform(normalizePhone)

  // This makes sure the phone is a string.
  @IsString({ message: 'Phone must be a string.' })

  // This makes sure the phone is not empty.
  @IsNotEmpty({ message: 'Phone is required.' })

  // This makes sure the phone number has 10 to 15 digits and can start with +.
  @Matches(/^\+?\d{10,15}$/, {
    message: 'Phone must be a valid number with 10 to 15 digits.',
  })
  phone: string;

  // This makes sure the password is a string.
  @IsString({ message: 'Password must be a string.' })

  // This makes sure the password is not empty.
  @IsNotEmpty({ message: 'Password is required.' })

  // This makes sure the password has at least 8 characters.
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })

  // This makes sure the password does not go over 128 characters.
  @MaxLength(128, { message: 'Password must not exceed 128 characters.' })

  // This makes sure the password includes uppercase, lowercase, number, and special character.
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  password: string;
}
