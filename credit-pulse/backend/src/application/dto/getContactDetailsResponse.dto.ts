export class ContactAddressDto {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class GetContactDetailsResponseDto {
  email: string;
  mobile: string;
  alternatePhone: string;
  residentialAddress: ContactAddressDto;
  mailingSameAsResidential: boolean;
  mailingAddress: ContactAddressDto;
}
