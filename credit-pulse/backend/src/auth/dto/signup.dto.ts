import { IsNotEmpty, IsString } from 'class-validator';

export class SignUpRequestDto {
  @IsString({ message: 'FirstName must be a string.' })
  @IsNotEmpty({ message: 'FirstName is required.' })
  firstName: string;

  @IsString({ message: 'LastName must be a string.' })
  @IsNotEmpty({ message: 'LastName is required.' })
  lastName: string;

  @IsString({ message: 'Email must be a string.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;
  @IsString({ message: 'Phone must be a string.' })
  @IsNotEmpty({ message: 'Phone is required.' })
  phone: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}

export class SignUpResponseDto {
  userId: string;
  email: string;
  phone: string | null;
}
