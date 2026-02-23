"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  sanitizeMobile,
  validateSignUp,
  SignUpFormErrors,
  SignUpFormState,
} from "../utils/signupValidation";
import axios from "axios";

export default function SignUpPage() {
  const router = useRouter();

  const [form, setForm] = useState<SignUpFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof SignUpFormState, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For button enable/disable only (doesn't show errors by itself)
  const isValid = useMemo(
    () => Object.keys(validateSignUp(form)).length === 0,
    [form],
  );

  function setField<K extends keyof SignUpFormState>(
    key: K,
    value: SignUpFormState[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // Only validate live if user has touched the field OR already tried submitting
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

    const validationErrors = validateSignUp(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await axios.post("http://localhost:3001/auth/signup", form, {
        headers: {
          "Content-Type": "application/json",
          "Allow-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        const errorMessage =
          typeof apiMessage === "string"
            ? apiMessage
            : "Sign up failed. Please check your details and try again.";

        setErrors({
          email: errorMessage,
        });
      }

      setIsSubmitting(false);
      return;
    }

    setSuccessMsg("Account created (dummy). Redirecting to Sign In...");

    setTimeout(() => {
      router.push("/signin");
    }, 900);
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
        : "Apple sign-up (dummy). Redirecting to Home...",
    );

    setTimeout(() => {
      router.push("/");
    }, 900);
  }

  return (
    <main className="panel split clearfix" aria-labelledby="signup-title">
      <section className="split-left" aria-label="Signup image panel">
        <div className="img-x" aria-hidden="true" />
        <div className="img-text">Image</div>
      </section>

      <section className="split-right">
        <h1 id="signup-title" className="form-title signup-title">
          Sign Up
        </h1>

        <div className="form-area signup-area">
          {successMsg && (
            <div className="alert success" role="status" aria-live="polite">
              {successMsg}
            </div>
          )}

          <button
            type="button"
            className="social-btn social-btn-top"
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

          <div
            className="or-row clearfix"
            aria-label="Alternative signup options"
          >
            <div className="or-line" aria-hidden="true" />
            <div className="or-text or-text-lower" aria-hidden="true">
              or
            </div>
            <div className="or-line" aria-hidden="true" />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group-md">
              <label className="label" htmlFor="firstName">
                First Name
              </label>
              <input
                id="firstName"
                className={`input ${errors.firstName ? "input-error signup-error-bg" : ""}`}
                type="text"
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                onBlur={() => onBlurField("firstName")}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? "firstName-error" : undefined
                }
                placeholder="Enter your first name"
                disabled={isSubmitting}
                required
              />
              {errors.firstName && (
                <p id="firstName-error" className="error-text" role="alert">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="form-group-md">
              <label className="label" htmlFor="lastName">
                Last Name
              </label>
              <input
                id="lastName"
                className={`input ${errors.lastName ? "input-error signup-error-bg" : ""}`}
                type="text"
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                onBlur={() => onBlurField("lastName")}
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? "lastName-error" : undefined
                }
                placeholder="Enter your last name"
                disabled={isSubmitting}
                required
              />
              {errors.lastName && (
                <p id="lastName-error" className="error-text" role="alert">
                  {errors.lastName}
                </p>
              )}
            </div>

            <div className="form-group-md">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={`input ${errors.email ? "input-error signup-error-bg" : ""}`}
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => onBlurField("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="example@domain.com"
                disabled={isSubmitting}
                required
              />
              {errors.email && (
                <p id="email-error" className="error-text" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-group-md">
              <label className="label" htmlFor="mobile">
                Mobile No (10 digits)
              </label>
              <input
                id="mobile"
                className={`input ${errors.phone ? "input-error signup-error-bg" : ""}`}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={form.phone}
                onChange={(e) =>
                  setField("phone", sanitizeMobile(e.target.value))
                }
                onBlur={() => onBlurField("phone")}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                placeholder="1234567890"
                disabled={isSubmitting}
                required
              />
              {errors.phone && (
                <p id="phone-error" className="error-text" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="form-group-md">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className={`input ${errors.password ? "input-error signup-error-bg" : ""}`}
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => onBlurField("password")}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                placeholder="Min 8 chars, Upper, Lower, Number, Symbol"
                disabled={isSubmitting}
                required
              />
              {errors.password && (
                <p id="password-error" className="error-text" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="signup-submit-btn"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="signup-hint">
            Mobile must be exactly 10 digits. Password must include uppercase,
            lowercase, a number, and a symbol.
          </p>
        </div>
      </section>
    </main>
  );
}
