"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateSignIn, SignInErrors } from "../utils/signinValidation";
import { useAuth } from "../../context/AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignInErrors>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    // Stops default form submit
    e.preventDefault();

    // Prevents multiple submit clicks
    if (isSubmitting) return;

    // Validates sign in fields
    const validationErrors = validateSignIn(loginId, password);
    setErrors(validationErrors);

    // Stops submit on validation errors
    if (Object.keys(validationErrors).length > 0) return;

    // Starts loading state
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrors({});

    try {
      // Sends sign in request
      const response = await axios.post("/api/auth/signin", {
        loginId,
        password,
      });

      const responseData = response.data;

      // Reads token from response
      const accessToken =
        responseData?.accessToken ||
        responseData?.token ||
        responseData?.data?.accessToken ||
        responseData?.data?.token ||
        null;

      // Reads user data from response
      const userData = responseData?.user ||
        responseData?.data?.user || {
          loginId,
        };

      // Stops flow if token is missing
      if (!accessToken) {
        setErrors({
          loginId: "Sign in succeeded, but no access token was returned.",
        });
        setIsSubmitting(false);
        return;
      }

      // Saves token and user details
      login(accessToken, userData);

      // Normalizes role code for redirect
      const normalizedRoleCode =
        typeof userData?.roleCode === "string"
          ? userData.roleCode.trim().toUpperCase()
          : "";

      // Decides page after login
      const redirectPath =
        normalizedRoleCode === "ADMIN" ? "/admin" : "/dashboard";

      // Shows success message
      setSuccessMsg(
        normalizedRoleCode === "ADMIN"
          ? "Signed in successfully. Redirecting to admin page..."
          : "Signed in successfully. Redirecting to dashboard...",
      );

      // Redirects user after short delay
      setTimeout(() => {
        router.push(redirectPath);
      }, 900);
    } catch (error) {
      // Handles api error response
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        const errorMessage =
          typeof apiMessage === "string"
            ? apiMessage
            : "Sign in failed. Please check your credentials.";

        setErrors({ loginId: errorMessage });
        setIsSubmitting(false);
        return;
      }

      // Handles server connection failure
      setErrors({
        loginId:
          "Unable to reach the server. Please make sure the backend is running.",
      });

      setIsSubmitting(false);
    }
  };

  const handleSocial = (provider: "google" | "apple") => {
    // Shows social login placeholder message
    setErrors({
      loginId: `${
        provider === "google" ? "Google" : "Apple"
      } sign-in is not integrated yet.`,
    });
  };

  return (
    <main className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-5">
          <div className="cp-card auth-card">
            <h1 className="fw-bold mb-3">Sign In</h1>
            <p className="mb-4 auth-muted">Access your CreditPulse account.</p>

            {successMsg && (
              <div
                className="alert alert-success"
                role="status"
                aria-live="polite"
              >
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="loginId" className="form-label fw-semibold">
                  Email / Mobile No
                </label>
                <input
                  id="loginId"
                  name="loginId"
                  className={`form-control ${errors.loginId ? "is-invalid" : ""}`}
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  aria-invalid={!!errors.loginId}
                  aria-describedby={
                    errors.loginId ? "loginId-error" : undefined
                  }
                  disabled={isSubmitting}
                  required
                />
                {errors.loginId && (
                  <div id="loginId-error" className="invalid-feedback">
                    {errors.loginId}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label
                    htmlFor="password"
                    className="form-label fw-semibold mb-0"
                  >
                    Password
                  </label>
                  <a className="auth-link" href="/forgot-password">
                    Forgot?
                  </a>
                </div>

                <input
                  id="password"
                  name="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  disabled={isSubmitting}
                  required
                />
                {errors.password && (
                  <div id="password-error" className="invalid-feedback">
                    {errors.password}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 fw-bold py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>

              <div
                className="auth-or my-4"
                aria-label="Alternative sign in options"
              >
                <div className="auth-or-line" aria-hidden="true" />
                <div className="auth-or-text" aria-hidden="true">
                  OR
                </div>
                <div className="auth-or-line" aria-hidden="true" />
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary w-100 fw-semibold py-2 mb-2"
                onClick={() => handleSocial("google")}
                disabled={isSubmitting}
              >
                Continue with Google
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary w-100 fw-semibold py-2"
                onClick={() => handleSocial("apple")}
                disabled={isSubmitting}
              >
                Continue with Apple
              </button>

              <p className="text-center mt-3 mb-0">
                <span className="auth-muted">New here?</span>{" "}
                <a className="auth-link fw-semibold" href="/signup">
                  Create an account
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
