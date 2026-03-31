"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  sanitizeMobile,
  validateSignUp,
  type SignUpFormErrors,
  type SignUpFormState,
} from "../utils/signupValidation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignUpFormState>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedValue = name === "mobile" ? sanitizeMobile(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setGeneralError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validateSignUp(formData);
    setErrors(validationErrors);
    setGeneralError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: sanitizeMobile(formData.mobile),
        password: formData.password,
      };

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message || data?.error || "Signup failed. Please try again.";

        setGeneralError(message);
        return;
      }

      router.push("/signin");
    } catch (error) {
      console.error("Signup error:", error);
      setGeneralError(
        "Could not connect to the server. Please check the backend and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container py-4 py-md-5">
      <div className="panel split">
        <div className="split-left position-relative">
          <div className="img-x" />
          <div className="img-text">Sign Up</div>
        </div>

        <div className="split-right">
          <h1 className="form-title signup-title">Create your account</h1>
          <p className="auth-muted mb-4">
            Sign up to start your CreditPulse application.
          </p>

          {generalError && (
            <div className="alert" role="alert">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="row">
              <div className="col-md-6 form-group-md">
                <label htmlFor="firstName" className="label">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className={`input ${errors.firstName ? "input-error" : ""}`}
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="error-text">{errors.firstName}</p>
                )}
              </div>

              <div className="col-md-6 form-group-md">
                <label htmlFor="lastName" className="label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className={`input ${errors.lastName ? "input-error" : ""}`}
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="error-text">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="form-group-md">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`input ${errors.email ? "input-error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="form-group-md">
              <label htmlFor="mobile" className="label">
                Phone Number
              </label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className={`input ${errors.mobile ? "input-error" : ""}`}
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
              {errors.mobile && <p className="error-text">{errors.mobile}</p>}
            </div>

            <div className="form-group-md">
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`input ${errors.password ? "input-error" : ""}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>

            <div className="form-group-lg">
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={`input ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="signup-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-3 mb-0">
            <span className="auth-muted">Already have an account? </span>
            <Link href="/signin" className="auth-link fw-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}