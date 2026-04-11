// This DTO is used to return the response after sign-up is completed.
export class SignUpResponseDto {
  // This stores the unique ID of the newly created user.
  userId?: string;

  // This stores the user's email address.
  email?: string;

  // This stores the user's phone number, if available.
  phone?: string | null;
}
