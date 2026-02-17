

export type AuthProvider = "local" | "google" | "apple";

/** Request body for customer registration (local email/password). */
export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string; // digits only (10)
  password: string;
};

/** Response returned after successful registration. */
export type RegisterResponse = {
  message: string;
  userId?: string; // optional, depending on backend
  provider: AuthProvider;
};

/** Request body for customer login (email or mobile + password). */
export type LoginRequest = {
  loginId: string; // email OR mobile
  password: string;
};

/** Response returned after successful login. */
export type LoginResponse = {
  message: string;
  provider: AuthProvider;
  // If backend returns tokens later, keep optional so frontend compiles now:
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    role?: "Customer" | "Admin" | "SourcingOfficer" | "CreditAnalyst" | "DisbursalOfficer";
  };
};
