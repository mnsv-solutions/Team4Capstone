export type SignInErrors = {
  loginId?: string;
  password?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

export function sanitizeMobile(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function normalizeLoginId(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.includes("@")) {
    return trimmedValue.toLowerCase();
  }

  return sanitizeMobile(trimmedValue);
}

export function validateSignIn(loginId: string, password: string): SignInErrors {
  const errors: SignInErrors = {};

  const rawValue = loginId.trim();
  const normalizedLoginId = normalizeLoginId(loginId);

  if (!rawValue) {
    errors.loginId = "Email or mobile number is required.";
  } else if (rawValue.includes("@")) {
    if (rawValue.includes(" ")) {
      errors.loginId = "Email address cannot contain spaces.";
    } else if (!EMAIL_REGEX.test(normalizedLoginId)) {
      errors.loginId = "Enter a valid email address.";
    }
  } else {
    if (!PHONE_REGEX.test(normalizedLoginId)) {
      errors.loginId = "Enter a valid 10-digit mobile number.";
    }
  }

  if (!password || password.trim().length === 0) {
    errors.password = "Password is required.";
  }

  return errors;
}