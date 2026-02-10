
"use client";

import { useMemo, useState } from "react";
import { sanitizeMobile, validateSignUp, SignUpFormErrors, SignUpFormState } from "../utils/signupValidation";

export default function SignUpPage() {
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

  const isValid = useMemo(() => Object.keys(validateSignUp(form)).length === 0, [form]);

  function setField<K extends keyof SignUpFormState>(key: K, value: SignUpFormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (touched[key] || submitted) setErrors(validateSignUp(next));
      return next;
    });
  }

  function onBlur<K extends keyof SignUpFormState>(key: K) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors(validateSignUp(form));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);

    const nextErrors = validateSignUp(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    alert("Account details validated.");
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
          <button type="button" className="social-btn social-btn-top">
            Continue with Google
          </button>

          <button type="button" className="social-btn">
            Continue with Apple
          </button>

          <div className="or-row clearfix" aria-label="Alternative signup options">
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
                onBlur={() => onBlur("firstName")}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
                placeholder="Enter your first name"
              />
              {errors.firstName ? (
                <p id="firstName-error" className="error-text" role="alert">
                  {errors.firstName}
                </p>
              ) : null}
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
                onBlur={() => onBlur("lastName")}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
                placeholder="Enter your last name"
              />
              {errors.lastName ? (
                <p id="lastName-error" className="error-text" role="alert">
                  {errors.lastName}
                </p>
              ) : null}
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
                onBlur={() => onBlur("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="example@domain.com"
              />
              {errors.email ? (
                <p id="email-error" className="error-text" role="alert">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="form-group-md">
              <label className="label" htmlFor="mobile">
                Mobile No (10 digits)
              </label>
              <input
                id="mobile"
                className={`input ${errors.mobile ? "input-error signup-error-bg" : ""}`}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={form.mobile}
                onChange={(e) => setField("mobile", sanitizeMobile(e.target.value))}
                onBlur={() => onBlur("mobile")}
                aria-invalid={!!errors.mobile}
                aria-describedby={errors.mobile ? "mobile-error" : undefined}
                placeholder="1234567890"
              />
              {errors.mobile ? (
                <p id="mobile-error" className="error-text" role="alert">
                  {errors.mobile}
                </p>
              ) : null}
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
                onBlur={() => onBlur("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                placeholder="Min 8 chars, Upper, Lower, Number, Symbol"
              />
              {errors.password ? (
                <p id="password-error" className="error-text" role="alert">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <button type="submit" className="signup-submit-btn" disabled={!isValid}>
              Create Account
            </button>
          </form>

          <p className="signup-hint">
            Mobile must be exactly 10 digits. Password must include uppercase, lowercase, a number, and a symbol.
          </p>
        </div>
      </section>
    </main>
  );
}