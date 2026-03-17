"use client";

import { useState } from "react";

export default function Home() {
  // Stores the application number entered by the user
  const [applicationNo, setApplicationNo] = useState("");

  // Stores the date of birth selected by the user
  const [dob, setDob] = useState("");

  // Stores validation error messages for both fields
  const [errors, setErrors] = useState<{ applicationNo?: string; dob?: string }>({});

  // Stores success message after valid form submission
  const [successMsg, setSuccessMsg] = useState("");

  // This function checks if the given value has only letters and numbers
  // It returns true if valid, otherwise false
  function isAlphaNumeric(value: string) {
    return /^[A-Za-z0-9]+$/.test(value);
  }

  // This function checks whether the user is 18 years old or above
  function isAdult(dateString: string) {
    const today = new Date();
    const birthDate = new Date(dateString);

    // First calculate age by subtracting years
    let age = today.getFullYear() - birthDate.getFullYear();

    // Then check month difference to make age more accurate
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // If birthday has not happened yet this year, reduce age by 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age = age - 1;
    }

    // Return true if age is 18 or more
    return age >= 18;
  }

  // This function validates the whole form
  // It checks both application number and date of birth
  function validate() {
    // Create an empty object to store errors
    const nextErrors: { applicationNo?: string; dob?: string } = {};

    // Remove extra spaces from start and end
    const value = applicationNo.trim();

    // Application number validations
    if (!value) {
      nextErrors.applicationNo = "Please enter your application number.";
    } else if (value.includes(" ")) {
      nextErrors.applicationNo = "No spaces are allowed in the application number.";
    } else if (value.length !== 16) {
      nextErrors.applicationNo = "Application number must be exactly 16 characters.";
    } else if (!value.startsWith("APPL")) {
      nextErrors.applicationNo = "Application number must start with APPL.";
    } else if (!isAlphaNumeric(value)) {
      nextErrors.applicationNo = "Only letters and numbers are allowed (no special characters).";
    }

    // Date of birth validations
    if (!dob) {
      nextErrors.dob = "Please select your date of birth.";
    } else {
      const birthDate = new Date(dob);
      const today = new Date();

      // Check if date is invalid
      if (Number.isNaN(birthDate.getTime())) {
        nextErrors.dob = "Please enter a valid date of birth.";
      }
      // Check if user selected a future date
      else if (birthDate > today) {
        nextErrors.dob = "Date of birth cannot be in the future.";
      }
      // Check if user is under 18
      else if (!isAdult(dob)) {
        nextErrors.dob = "You must be at least 18 years old.";
      }
    }

    // Return all validation errors
    return nextErrors;
  }

  // This function runs when the form is submitted
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Prevent page refresh
    e.preventDefault();

    // Clear old success message
    setSuccessMsg("");

    // Run validation and store errors
    const nextErrors = validate();
    setErrors(nextErrors);

    // If any error exists, stop submission
    if (Object.keys(nextErrors).length > 0) return;

    // If no errors, show success message
    setSuccessMsg("Status check submitted (dummy). Backend will be connected in later sprint.");
  }

  // This function formats application number while typing
  function handleAppNoChange(value: string) {
    // Remove spaces from the value
    const noSpaces = value.replace(/\s+/g, "");

    // Convert everything to uppercase and store it
    setApplicationNo(noSpaces.toUpperCase());
  }

  return (
    <main className="d-flex flex-column gap-4">
      <section className="cp-hero-section p-4 p-md-5 rounded-4">
        <div className="row align-items-center g-4">
          <div className="col-12 col-lg-7">
            <h1 className="fw-bold mb-3">
              Track your loan application with clarity and confidence.
            </h1>

            <p className="mb-4">
              CreditPulse is a digital loan origination and credit assessment platform that helps
              applicants understand progress, next steps, and required actions in one place.
            </p>

            <div className="d-flex gap-2 flex-wrap mb-4">
              <a className="btn btn-primary" href="/signup">
                Get Started
              </a>
              <a className="btn btn-outline-light" href="/about">
                Learn More
              </a>
            </div>

            {/* Show success message only when form is valid and submitted */}
            {successMsg && (
              <div className="alert alert-success" role="status" aria-live="polite">
                {successMsg}
              </div>
            )}

            {/* Status check form */}
            <form className="row g-2" onSubmit={handleSubmit} aria-label="Check application status">
              <div className="col-12 col-md-5">
                <input
                  className={`form-control ${errors.applicationNo ? "is-invalid" : ""}`}
                  type="text"
                  name="applicationNo"
                  placeholder="Application Number (e.g., APPL123456789012)"
                  aria-label="Application Number"
                  value={applicationNo}
                  onChange={(e) => handleAppNoChange(e.target.value)}
                />

                {/* Show application number error only if it exists */}
                {errors.applicationNo && (
                  <div className="invalid-feedback">{errors.applicationNo}</div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <input
                  className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                  type="date"
                  name="dob"
                  aria-label="Date of birth"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />

                {/* Show DOB error only if it exists */}
                {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
              </div>

              <div className="col-12 col-md-3">
                <button className="btn btn-primary w-100" type="submit">
                  Check Status
                </button>
              </div>
            </form>

            <p className="mt-3 mb-0">
              Tip: Your application number is shared during submission. Enter it exactly as provided.
            </p>
          </div>

          {/* Right side information card */}
          <div className="col-12 col-lg-5">
            <div className="cp-card p-4 rounded-4">
              <h2 className="h4 fw-bold mb-3">Why CreditPulse?</h2>
              <ul className="mb-0">
                <li className="mb-2">Clear application stages and progress tracking</li>
                <li className="mb-2">Fewer delays with timely document requests</li>
                <li className="mb-2">Centralized dashboard for updates and actions</li>
                <li className="mb-0">Designed for a smooth applicant experience</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Steps section */}
      <section className="cp-hero-section p-4 p-md-5 rounded-4">
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2">Steps away from getting approved</h2>
          <p className="mb-0">A simple process that keeps applicants informed from start to finish.</p>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-3">
            <div className="cp-card p-4 rounded-4 h-100">
              <h3 className="h5 fw-bold mb-2">Create an account</h3>
              <p className="mb-0">Register to access your application dashboard securely.</p>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="cp-card p-4 rounded-4 h-100">
              <h3 className="h5 fw-bold mb-2">Apply for a loan</h3>
              <p className="mb-0">Submit key details and start the origination process.</p>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="cp-card p-4 rounded-4 h-100">
              <h3 className="h5 fw-bold mb-2">Upload documents</h3>
              <p className="mb-0">Provide required proofs when requested to avoid delays.</p>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="cp-card p-4 rounded-4 h-100">
              <h3 className="h5 fw-bold mb-2">Track decision</h3>
              <p className="mb-0">See review status, verification updates, and final decision.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial section */}
      <section className="cp-hero-section p-4 p-md-5 rounded-4">
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2">What users say</h2>
          <p className="mb-0">Built for transparency, speed, and trust.</p>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-3">
            <div className="cp-card p-4 rounded-4 h-100">
              <h3 className="h5 fw-bold mb-2">Clear updates</h3>
              <p className="mb-0">“The stages were easy to understand. I always knew what was next.”</p>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="cp-card p-4 rounded-4 h-100">
              <h3 className="h5 fw-bold mb-2">Saves time</h3>
              <p className="mb-0">“No more calling support. I tracked everything from one dashboard.”</p>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="cp-card p-4 rounded-4 h-100">
              <h3 className="h5 fw-bold mb-2">Professional feel</h3>
              <p className="mb-0">“The UI feels modern and trustworthy. The process is well explained.”</p>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="cp-card p-4 rounded-4 h-100">
              <h3 className="h5 fw-bold mb-2">Less confusion</h3>
              <p className="mb-0">“I understood why my application was pending and what documents I needed.”</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}