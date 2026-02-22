export class SignUpRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export class SignUpResponseDto {
  userId: string;
  email: string;
  phone: string | null; //ToDo: make the phone required just like email
}
