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

  const isValid = useMemo(
    () => Object.keys(validateSignUp(form)).length === 0,
    [form]
  );

  function setField<K extends keyof SignUpFormState>(
    key: K,
    value: SignUpFormState[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (touched[key] || submitted) setErrors(validateSignUp(next));
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
      await axios.post("/api/auth/signup", form, {
        headers: {
          "Content-Type": "application/json",
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

    setSuccessMsg("Account created successfully. Redirecting to Sign In...");

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
        : "Apple sign-up (dummy). Redirecting to Home...",
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

                    <div className="mb-3">
                      <label htmlFor="lastName" className="form-label fw-semibold">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setField("lastName", e.target.value)}
                        onBlur={() => onBlurField("lastName")}
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? "lastName-error" : undefined}
                        placeholder="Enter your last name"
                        disabled={isSubmitting}
                        required
                      />
                      {errors.lastName && (
                        <div id="lastName-error" className="invalid-feedback">
                          {errors.lastName}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-semibold">
                        Email
                      </label>
                      <input
                        id="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
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
                        <div id="email-error" className="invalid-feedback">
                          {errors.email}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label fw-semibold">
                        phone No (10 digits)
                      </label>
                      <input
                        id="phone"
                        className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => setField("phone", sanitizeMobile(e.target.value))}
                        onBlur={() => onBlurField("phone")}
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? "mobile-error" : undefined}
                        placeholder="1234567890"
                        disabled={isSubmitting}
                        required
                      />
                      {errors.phone && (
                        <div id="phone-error" className="invalid-feedback">
                          {errors.phone}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password" className="form-label fw-semibold">
                        Password
                      </label>
                      <input
                        id="password"
                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        type="password"
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        onBlur={() => onBlurField("password")}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                        placeholder="Min 8 chars, Upper, Lower, Number, Symbol"
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
                      disabled={isSubmitting || !isValid}
                    >
                      {isSubmitting ? "Creating..." : "Create Account"}
                    </button>

                    <p className="small auth-muted mt-3 mb-0">
                      phone must be exactly 10 digits. Password must include uppercase, lowercase,
                      a number, and a symbol.
                    </p>

                    <p className="text-center mt-3 mb-0">
                      <span className="auth-muted">Already have an account?</span>{" "}
                      <a className="auth-link fw-semibold" href="/signin">
                        Sign in
                      </a>
                    </p>
                  </form>
                </div>
              </div>
            </div>
            {/* end row */}
          </div>
        </div>
      </div>
    </main>
  );
}