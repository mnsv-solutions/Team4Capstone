"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  sanitizePhone,
  validateSignUp,
  normalizeSignUpValues,
  SignUpFormErrors,
  SignUpFormState,
} from "../utils/signupValidation";
import styles from "./page.module.css";

type SignUpApiPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

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
  const [touched, setTouched] = useState<Partial<Record<keyof SignUpFormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(
    () => Object.keys(validateSignUp(form)).length === 0,
    [form],
  );

  function setField<K extends keyof SignUpFormState>(key: K, value: SignUpFormState[K]) {
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
    setSubmitError("");

    const normalizedForm = normalizeSignUpValues(form);
    setForm(normalizedForm);

    const validationErrors = validateSignUp(normalizedForm);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: SignUpApiPayload = {
        firstName: normalizedForm.firstName,
        lastName: normalizedForm.lastName,
        email: normalizedForm.email,
        phone: normalizedForm.phone,
        password: normalizedForm.password,
      };

      const response = await fetch("http://localhost:3001/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const backendMessage =
          data?.message ||
          data?.error ||
          "Sign up failed. Please check your details and try again.";

        setSubmitError(
          Array.isArray(backendMessage)
            ? backendMessage.join(" ")
            : String(backendMessage)
        );
        return;
      }

      setSuccessMsg("Account created successfully. Redirecting to Sign In...");

      setTimeout(() => {
        router.push("/signin");
      }, 1200);
    } catch {
      setSubmitError(
        "Unable to connect to the server. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.visualPanel}>
          <div className={styles.visualBox}>
            <span className={styles.eyebrow}>Create account</span>
            <h1 className={styles.visualTitle}>Start your CreditPulse journey.</h1>
            <p className={styles.visualText}>
              Build your account to follow application progress, submit details securely, and stay
              informed about what comes next.
            </p>
            <div className={styles.visualPoints}>
              <span className={styles.visualPoint}>Track every stage clearly</span>
              <span className={styles.visualPoint}>Keep documents organized</span>
              <span className={styles.visualPoint}>Receive next-step guidance</span>
            </div>
            <div className={styles.visualImageWrap}>
              <Image
                src="/signup/signup-illustration.svg"
                alt="Illustration of a secure digital loan application journey"
                width={720}
                height={520}
                className={styles.visualImage}
                priority
              />
            </div>
            <div className={styles.visualBadge}>Secure onboarding for applicants</div>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <span className={styles.formEyebrow}>Quick onboarding</span>
            <h1 className={styles.title}>Sign Up</h1>
            <p className={styles.subtitle}>Create your CreditPulse account in just a few details.</p>
          </div>

          {successMsg && (
            <div className="alert alert-success" role="status" aria-live="polite">
              {successMsg}
            </div>
          )}

          {submitError && (
            <div className="alert alert-danger" role="alert" aria-live="assertive">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.formGrid}>
              <div>
                <label htmlFor="firstName" className="form-label fw-semibold">
                  First Name
                </label>
                <input
                  id="firstName"
                  className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  onBlur={() => onBlurField("firstName")}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  placeholder="Enter your first name"
                  disabled={isSubmitting}
                  autoComplete="given-name"
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

            <div>
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
                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setField("phone", sanitizePhone(e.target.value))}
                onBlur={() => onBlurField("phone")}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                placeholder="1234567890"
                disabled={isSubmitting}
                autoComplete="tel"
                required
              />
              {errors.phone && (
                <div id="phone-error" className="invalid-feedback">
                  {errors.phone}
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