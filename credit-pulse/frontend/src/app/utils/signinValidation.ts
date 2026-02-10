export type SignInErrors = {
    loginId?: string;
    password?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

export function validateSignIn(
    loginId: string,
    password: string
): SignInErrors {
    const errors: SignInErrors = {};

    const value = loginId.trim();
    const numericPhone = value.replace(/\D/g, "");

    if (!value) {
        errors.loginId = "Email or mobile number is required.";
    } else {
        const isEmail = EMAIL_REGEX.test(value);
        const isPhone = PHONE_REGEX.test(numericPhone);

        if (!isEmail && !isPhone) {
            errors.loginId = "Enter a valid email or a 10-digit mobile number.";
        }
    }

    if (!password) {
        errors.password = "Password is required.";
    } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
    }

    return errors;
}
