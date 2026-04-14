"use client";

// This page handles user sign-in and routes authenticated users to the correct workspace.
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateSignIn, SignInErrors } from "../utils/signinValidation";
import { useAuth } from "../../context/AuthContext";
import styles from "./page.module.css";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignInErrors>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    // Validates credentials, requests an access token, and redirects after sign-in.
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validateSignIn(loginId, password);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSuccessMsg("");
    setErrors({});

    try {
      const response = await axios.post(process.env.NEXT_PUBLIC_API_URL + "/auth/signin", {
        loginId,
        password,
      });

      const responseData = response.data;

      const accessToken =
        responseData?.accessToken ||
        responseData?.token ||
        responseData?.data?.accessToken ||
        responseData?.data?.token ||
        null;

      const userData = responseData?.user || responseData?.data?.user || { loginId };

      if (!accessToken) {
        setErrors({
          loginId: "Sign in succeeded, but no access token was returned.",
        });
        setIsSubmitting(false);
        return;
      }

      const isAdminUser = await login(accessToken, userData);

      setSuccessMsg(
        isAdminUser
          ? "Signed in successfully. Redirecting to admin page..."
          : "Signed in successfully. Redirecting to dashboard...",
      );

      setTimeout(() => {
        router.push(isAdminUser ? "/admin" : "/dashboard");
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
        loginId: "Unable to reach the server. Please make sure the backend is running.",
      });

      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      {/* Sign-in card: header, feedback alerts, and credential form */}
      <section className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.eyebrow}>Welcome back</span>
            <h1 className={styles.title}>Sign In</h1>
            <p className={styles.subtitle}>Access your CreditPulse account.</p>
          </div>

          {successMsg && (
            <div className="alert alert-success" role="status" aria-live="polite">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div>
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
                aria-describedby={errors.loginId ? "loginId-error" : undefined}
                disabled={isSubmitting}
                required
              />
              {errors.loginId && (
                <div id="loginId-error" className="invalid-feedback">
                  {errors.loginId}
                </div>
              )}
            </div>

            <div>
              <div className={styles.passwordRow}>
                <label htmlFor="password" className="form-label fw-semibold mb-0">
                  Password
                </label>
                <a className={styles.link} href="/forgot-password">
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
                aria-describedby={errors.password ? "password-error" : undefined}
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

            <p className={styles.footerText}>
              <span className={styles.muted}>New here?</span>{" "}
              <Link className={styles.link} href="/signup">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
