import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

// This helper function removes extra spaces from string input values.
const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// This DTO is used to validate the sign-in request data.
export class SignInRequestDto {
  // This trims extra spaces from the login ID before validation.
  @Transform(trimValue)

  // This makes sure the login ID is a string.
  @IsString({ message: 'Login Id must be a string.' })

  // This makes sure the login ID is not empty.
  @IsNotEmpty({ message: 'Login Id is required.' })

  // This makes sure the login ID is not longer than 255 characters.
  @MaxLength(255, { message: 'Login Id must not exceed 255 characters.' })
  loginId: string;

  // This makes sure the password is a string.
  @IsString({ message: 'Password must be a string.' })

  // This makes sure the password is not empty.
  @IsNotEmpty({ message: 'Password is required.' })

  // This makes sure the password has at least 8 characters.
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })

  // This makes sure the password does not go over 128 characters.
  @MaxLength(128, { message: 'Password must not exceed 128 characters.' })
  password: string;
}
