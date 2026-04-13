export type SignUpFormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
};

export type SignUpFormErrors = Partial<Record<keyof SignUpFormState, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;

export function sanitizeMobile(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeSignUpValues(values: SignUpFormState): SignUpFormState {
  return {
    firstName: normalizeName(values.firstName),
    lastName: normalizeName(values.lastName),
    email: normalizeEmail(values.email),
    mobile: sanitizeMobile(values.mobile.trim()),
    password: values.password,
  };
}

export function validateSignUp(values: SignUpFormState): SignUpFormErrors {
  const normalizedValues = normalizeSignUpValues(values);

  const errors: SignUpFormErrors = {};

  const firstName = normalizedValues.firstName;
  const lastName = normalizedValues.lastName;
  const email = normalizedValues.email;
  const mobile = normalizedValues.mobile;
  const password = normalizedValues.password;

  if (!firstName) {
    errors.firstName = "First name is required.";
  } else if (firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  } else if (!NAME_REGEX.test(firstName)) {
    errors.firstName =
      "First name can contain letters, spaces, hyphens (-), and apostrophes (').";
  }

  if (!lastName) {
    errors.lastName = "Last name is required.";
  } else if (lastName.length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  } else if (!NAME_REGEX.test(lastName)) {
    errors.lastName =
      "Last name can contain letters, spaces, hyphens (-), and apostrophes (').";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (email.includes(" ")) {
    errors.email = "Email address cannot contain spaces.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!mobile) {
    errors.mobile = "Mobile number is required.";
  } else if (!PHONE_REGEX.test(mobile)) {
    errors.mobile = "Enter a valid 10-digit mobile number.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[a-z]/.test(password)) {
    errors.password = "Password must include at least 1 lowercase letter.";
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Password must include at least 1 uppercase letter.";
  } else if (!/[0-9]/.test(password)) {
    errors.password = "Password must include at least 1 number.";
  } else if (!/[^\w\s]/.test(password)) {
    errors.password = "Password must include at least 1 special character.";
  }

  return errors;
}