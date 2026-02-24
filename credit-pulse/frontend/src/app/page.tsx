"use client";

import { useState } from "react";

export default function Home() {
  const [applicationNo, setApplicationNo] = useState("");
  const [dob, setDob] = useState("");
  const [errors, setErrors] = useState<{ applicationNo?: string; dob?: string }>({});
  const [successMsg, setSuccessMsg] = useState("");

  function isAlphaNumeric(value: string) {
    return /^[A-Za-z0-9]+$/.test(value);
  }

  function isAdult(dateString: string) {
    const today = new Date();
    const birthDate = new Date(dateString);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age = age - 1;
    }

    return age >= 18;
  }

  function validate() {
    const nextErrors: { applicationNo?: string; dob?: string } = {};

    const value = applicationNo.trim();

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

    if (!dob) {
      nextErrors.dob = "Please select your date of birth.";
    } else {
      const birthDate = new Date(dob);
      const today = new Date();

      if (Number.isNaN(birthDate.getTime())) {
        nextErrors.dob = "Please enter a valid date of birth.";
      } else if (birthDate > today) {
        nextErrors.dob = "Date of birth cannot be in the future.";
      } else if (!isAdult(dob)) {
        nextErrors.dob = "You must be at least 18 years old.";
      }
    }

    return nextErrors;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccessMsg("");

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSuccessMsg("Status check submitted (dummy). Backend will be connected in later sprint.");
  }

  function handleAppNoChange(value: string) {
    const noSpaces = value.replace(/\s+/g, "");
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

            {successMsg && (
              <div className="alert alert-success" role="status" aria-live="polite">
                {successMsg}
              </div>
            )}

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