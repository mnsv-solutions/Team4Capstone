"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  sanitizeMobile,
  validateSignUp,
  normalizeSignUpValues,
  SignUpFormErrors,
  SignUpFormState,
} from "../utils/signupValidation";

type SignUpApiPayload = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  password: string;
};

export default function SignUpPage() {
  const router = useRouter();

  const [form, setForm] = useState<SignUpFormState>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignUpFormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => {
    return Object.keys(validateSignUp(form)).length === 0;
  }, [form]);

  function setField<K extends keyof SignUpFormState>(key: K, value: SignUpFormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (touched[key] || submitted) {
        setErrors(validateSignUp(next));
      }

      return next;
    });
  }

  function onBlurField<K extends keyof SignUpFormState>(key: K) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors(validateSignUp(form));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmitting) return;

    setSubmitted(true);
    setSuccessMsg("");
    setSubmitError("");

    const normalizedForm = normalizeSignUpValues(form);
    setForm(normalizedForm);

    const validationErrors = validateSignUp(normalizedForm);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg("Account created (dummy). Redirecting to Sign In...");

    setTimeout(() => router.push("/signin"), 900);
  }

  function handleSocial(provider: "google" | "apple") {
    if (isSubmitting) return;

    setErrors({});
    setTouched({});
    setSubmitted(false);

    setSuccessMsg("");
    setIsSubmitting(true);

    setSuccessMsg(
      provider === "google"
        ? "Google sign-up (dummy). Redirecting to Home..."
        : "Apple sign-up (dummy). Redirecting to Home..."
    );

    setTimeout(() => router.push("/"), 900);
  }

  return (
    <main className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* SINGLE box only (no cp-hero-section wrapper) */}
          <div className="cp-card p-0 overflow-hidden">
            <div className="row g-0">
              {/* Left panel (placeholder until you have an image) */}
              <div className="col-12 col-lg-6 auth-left d-flex align-items-center justify-content-center p-4">
                <div className="auth-image-box d-flex align-items-center justify-content-center">
                  <span className="auth-muted fw-semibold">Image</span>
                </div>
              </div>

              {/* Right panel */}
              <div className="col-12 col-lg-6">
                <div className="p-4 p-md-5">
                  <h1 className="fw-bold mb-2">Sign Up</h1>
                  <p className="auth-muted mb-4">
                    Create your CreditPulse account.
                  </p>

                  {successMsg && (
                    <div className="alert alert-success" role="status" aria-live="polite">
                      {successMsg}
                    </div>
                  )}

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

                  <div className="auth-or my-4" aria-label="Alternative signup options">
                    <div className="auth-or-line" aria-hidden="true" />
                    <div className="auth-or-text" aria-hidden="true">
                      or
                    </div>
                    <div className="auth-or-line" aria-hidden="true" />
                  </div>

                  <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-3">
                      <label htmlFor="firstName" className="form-label fw-semibold">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        onBlur={() => onBlurField("firstName")}
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? "firstName-error" : undefined}
                        placeholder="Enter your first name"
                        disabled={isSubmitting}
                        required
                      />
                      {errors.firstName && (
                        <div id="firstName-error" className="invalid-feedback">
                          {errors.firstName}
                        </div>
                      )}
                    </div>

              <div>
                <label htmlFor="lastName" className="form-label fw-semibold">
                  Last Name
                </label>
                <input
                  id="lastName"
                  className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  onBlur={() => onBlurField("lastName")}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  placeholder="Enter your last name"
                  disabled={isSubmitting}
                  autoComplete="family-name"
                  required
                />
                {errors.lastName && (
                  <div id="lastName-error" className="invalid-feedback">
                    {errors.lastName}
                  </div>
                )}
              </div>
            </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-semibold">
                        Email
                      </label>
                      <input
                        id="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        onBlur={() => onBlurField("email")}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        placeholder="example@domain.com"
                        disabled={isSubmitting}
                        autoComplete="email"
                        required
                      />
                      {errors.email && (
                        <div id="email-error" className="invalid-feedback">
                          {errors.email}
                        </div>
                      )}
                    </div>

            <div>
              <label htmlFor="mobile" className="form-label fw-semibold">
                Mobile No (10 digits)
              </label>
              <input
                id="mobile"
                className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                name="mobile"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={form.mobile}
                onChange={(e) => setField("mobile", sanitizeMobile(e.target.value))}
                onBlur={() => onBlurField("mobile")}
                aria-invalid={!!errors.mobile}
                aria-describedby={errors.mobile ? "mobile-error" : undefined}
                placeholder="1234567890"
                disabled={isSubmitting}
                autoComplete="tel"
                required
              />
              {errors.mobile && (
                <div id="mobile-error" className="invalid-feedback">
                  {errors.mobile}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label fw-semibold">
                Password
              </label>
              <input
                id="password"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                name="password"
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => onBlurField("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                placeholder="Min 8 chars, Upper, Lower, Number, Symbol"
                disabled={isSubmitting}
                autoComplete="new-password"
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
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>

            <p className={styles.hint}>
              Mobile must be exactly 10 digits. Password must include uppercase, lowercase, a
              number, and a symbol.
            </p>

            <p className={styles.footerText}>
              <span className={styles.muted}>Already have an account?</span>{" "}
              <Link className={styles.link} href="/signin">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
