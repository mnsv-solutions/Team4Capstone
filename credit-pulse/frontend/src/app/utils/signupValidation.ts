export type SignUpFormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
};

export type SignUpFormErrors = Partial<Record<keyof SignUpFormState, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;
const PHONE_REGEX = /^\d{10}$/;

export function sanitizeMobile(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function validateSignUp(values: SignUpFormState): SignUpFormErrors {
  const errors: SignUpFormErrors = {};

  const fn = values.firstName.trim();
  if (!fn) errors.firstName = "First name is required.";
  else if (fn.length < 2) errors.firstName = "First name must be at least 2 characters.";
  else if (!NAME_REGEX.test(fn))
    errors.firstName = "First name can contain letters, spaces, hyphens (-), and apostrophes (').";

  const ln = values.lastName.trim();
  if (!ln) errors.lastName = "Last name is required.";
  else if (ln.length < 2) errors.lastName = "Last name must be at least 2 characters.";
  else if (!NAME_REGEX.test(ln))
    errors.lastName = "Last name can contain letters, spaces, hyphens (-), and apostrophes (').";

  const em = values.email.trim();
  if (!em) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(em)) errors.email = "Please enter a valid email address (example@domain.com).";

  const mob = values.mobile.trim();
  if (!mob) errors.mobile = "Mobile number is required.";
  else if (!PHONE_REGEX.test(mob)) errors.mobile = "Mobile number must be exactly 10 digits.";

  const pw = values.password;
  if (!pw) errors.password = "Password is required.";
  else if (pw.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (!/[a-z]/.test(pw)) errors.password = "Password must include at least 1 lowercase letter.";
  else if (!/[A-Z]/.test(pw)) errors.password = "Password must include at least 1 uppercase letter.";
  else if (!/[0-9]/.test(pw)) errors.password = "Password must include at least 1 number.";
  else if (!/[^\w\s]/.test(pw))
    errors.password = "Password must include at least 1 special character (e.g., !@#$%).";

  return errors;
}