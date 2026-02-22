"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateSignIn, SignInErrors } from "../utils/signinValidation";

export default function SignInPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignInErrors>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validateSignIn(loginId, password);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      // TODO: Build this URL dynamically from environment variables
      await axios.post("http://localhost:3001/auth/signin", {
          loginId,
          password,
      }, {
        headers: {
          "Content-Type": "application/json",
          "Allow-Control-Allow-Origin": "*",
        },
      });

      setSuccessMsg("Signed in successfully. Redirecting to Home...");
      setTimeout(() => {
        router.push("/");
      }, 900);
    } catch (error) {
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

      setErrors({
        loginId:
          "Unable to reach the server. Please make sure the backend is running.",
      });

      setIsSubmitting(false);
    }
  };

  const handleSocial = (provider: "google" | "apple") => {
    if (isSubmitting) return;

    setErrors({});
    setIsSubmitting(true);
    setSuccessMsg(
      provider === "google"
        ? "Google sign-in (dummy). Redirecting to Home..."
        : "Apple sign-in (dummy). Redirecting to Home...",
    );

    setTimeout(() => {
      router.push("/");
    }, 900);
  };

  return (
    <main className="panel form-wrap" aria-labelledby="signin-title">
      <h1 id="signin-title" className="form-title">
        Sign In
      </h1>

      <div className="form-area">
        <form className="signin-form" onSubmit={handleSubmit} noValidate>
          {successMsg && (
            <div className="alert success" role="status" aria-live="polite">
              {successMsg}
            </div>
          )}

          <div className="form-group-lg">
            <label className="label" htmlFor="loginId">
              Email / Mobile No
            </label>
            <input
              id="loginId"
              name="loginId"
              className={`input ${errors.loginId ? "input-error" : ""}`}
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              aria-invalid={!!errors.loginId}
              aria-describedby={errors.loginId ? "loginId-error" : undefined}
              disabled={isSubmitting}
              required
            />
            {errors.loginId && (
              <p id="loginId-error" className="error-text" role="alert">
                {errors.loginId}
              </p>
            )}
          </div>

          <div className="form-group-sm">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              className={`input ${errors.password ? "input-error" : ""}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={isSubmitting}
              required
            />
            {errors.password && (
              <p id="password-error" className="error-text" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>

          <div
            className="or-row clearfix"
            aria-label="Alternative sign in options"
          >
            <div className="or-line" aria-hidden="true" />
            <div className="or-text" aria-hidden="true">
              OR
            </div>
            <div className="or-line" aria-hidden="true" />
          </div>

          <button
            type="button"
            className="social-btn"
            onClick={() => handleSocial("google")}
            disabled={isSubmitting}
          >
            Continue with Google
          </button>

          <button
            type="button"
            className="social-btn"
            onClick={() => handleSocial("apple")}
            disabled={isSubmitting}
          >
            Continue with Apple
          </button>
        </form>
      </div>
    </main>
  );
}
