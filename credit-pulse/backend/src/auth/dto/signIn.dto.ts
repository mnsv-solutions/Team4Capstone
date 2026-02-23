export class SignInRequestDto {
  loginId: string;
  password: string;
}

export class SignInResponseDto {
  accessToken: string;
}
