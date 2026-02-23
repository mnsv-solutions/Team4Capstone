import { IsNotEmpty, IsString } from 'class-validator';

export class SignInRequestDto {
  @IsString({ message: 'LoginId must be a string.' })
  @IsNotEmpty({ message: 'LoginId is required.' })
  loginId: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}

export class SignInResponseDto {
  accessToken: string;
}
