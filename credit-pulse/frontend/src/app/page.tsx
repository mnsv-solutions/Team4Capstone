"use client";

// Axios handles the API request.
import axios from "axios";

// React state manages form values, errors, loading, and result data.
import { useState, type FormEvent } from "react";

// Link handles navigation buttons.
import Link from "next/link";

// Stores validation messages for form fields.
type FormErrors = {
  applicationNo?: string;
  dob?: string;
};

// Stores the backend response.
type StatusResponse = {
  success: boolean;
  applicationNumber?: string;
  statusCode?: string;
  statusName?: string;
  reasonCode?: string;
};

// Main Home page component.
export default function HomePage() {
  // Stores the application number input.
  const [applicationNo, setApplicationNo] = useState("");

  // Stores the date of birth input.
  const [dob, setDob] = useState("");

  // Stores validation errors.
  const [errors, setErrors] = useState<FormErrors>({});

  // Stores API or backend error message.
  const [apiError, setApiError] = useState("");

  // Stores successful application status data.
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);

  // Stores loading state during form submission.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checks whether the entered date belongs to an adult applicant.
  function isAdult(dateString: string) {
    // Gets the current date.
    const today = new Date();

    // Converts the input string to a date object.
    const birthDate = new Date(dateString);

    // Starts with the year difference.
    let age = today.getFullYear() - birthDate.getFullYear();

    // Compares the month difference.
    const monthDifference = today.getMonth() - birthDate.getMonth();

    // Reduces age if the birthday has not occurred yet this year.
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age = age - 1;
    }

    // Returns true only when age is 18 or more.
    return age >= 18;
  }

  // Validates all form fields before API submission.
  function validateForm() {
    // Starts with no errors.
    const newErrors: FormErrors = {};

    // Removes extra spaces from the application number.
    const trimmedApplicationNo = applicationNo.trim();

    // Checks whether the application number is missing.
    if (!trimmedApplicationNo) {
      newErrors.applicationNo = "Please enter your application number.";
    }
    // Checks whether the application number format is invalid.
    else if (!/^APPL\d{10}$/.test(trimmedApplicationNo)) {
      newErrors.applicationNo =
        "Application number must start with APPL and contain exactly 10 digits after it.";
    }

    // Checks whether date of birth is missing.
    if (!dob) {
      newErrors.dob = "Please select your date of birth.";
    } else {
      // Converts the selected date to a date object.
      const birthDate = new Date(dob);

      // Gets the current date.
      const today = new Date();

      // Checks whether the date is invalid.
      if (Number.isNaN(birthDate.getTime())) {
        newErrors.dob = "Please enter a valid date of birth.";
      }
      // Checks whether the date is in the future.
      else if (birthDate > today) {
        newErrors.dob = "Date of birth cannot be in the future.";
      }
      // Checks whether the applicant is under 18.
      else if (!isAdult(dob)) {
        newErrors.dob = "You must be at least 18 years old.";
      }
    }

    // Returns all validation errors.
    return newErrors;
  }

  // Cleans and updates the application number field.
  function handleApplicationNoChange(value: string) {
    // Removes spaces and converts text to uppercase.
    const cleanValue = value.replace(/\s+/g, "").toUpperCase();

    // Updates the application number state.
    setApplicationNo(cleanValue);

    // Clears only the application number error while editing.
    setErrors((previousErrors) => ({
      ...previousErrors,
      applicationNo: undefined,
    }));

    // Clears old API error while input is changing.
    setApiError("");
  }

  // Updates the date of birth field.
  function handleDobChange(value: string) {
    // Updates the date of birth state.
    setDob(value);

    // Clears only the date of birth error while editing.
    setErrors((previousErrors) => ({
      ...previousErrors,
      dob: undefined,
    }));

    // Clears old API error while input is changing.
    setApiError("");
  }

  // Converts backend reason codes into readable messages.
  function getApiErrorMessage(reasonCode?: string) {
    switch (reasonCode) {
      case "NOT_FOUND":
        return "No active application was found for this application number.";
      case "DOB_MISMATCH":
        return "The entered date of birth does not match our records.";
      case "PRIMARY_NOT_FOUND":
        return "Primary applicant details could not be verified.";
      case "INACTIVE_STATUS":
        return "This application is currently not available for status tracking.";
      default:
        return "Unable to fetch application status right now. Please try again.";
    }
  }

  // Runs when the form is submitted.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Prevents the default page refresh.
    event.preventDefault();

    // Stops repeated submission while a request is already in progress.
    if (isSubmitting) return;

    // Clears old backend error before a new request.
    setApiError("");

    // Clears old success result before a new request.
    setStatusData(null);

    // Runs validation first.
    const validationErrors = validateForm();

    // Saves validation errors.
    setErrors(validationErrors);

    // Stops submission if validation errors exist.
    if (Object.keys(validationErrors).length > 0) return;

    // Starts loading state.
    setIsSubmitting(true);

    try {
      // Sends the request to the backend through the Next.js rewrite route.
      const response = await axios.post<StatusResponse>(
        "/api/application-status",
        {
          applicationNumber: applicationNo.trim(),
          dob: dob,
        },
      );

      // Saves successful backend response data.
      setStatusData(response.data);
    } catch (error) {
      // Handles axios-specific errors.
      if (axios.isAxiosError(error)) {
        // Reads reason code from backend response when available.
        const reasonCode = error.response?.data?.reasonCode;

        // Converts reason code into readable text.
        const errorMessage = getApiErrorMessage(reasonCode);

        // Displays the message on screen.
        setApiError(errorMessage);

        // Stops loading state.
        setIsSubmitting(false);
        return;
      }

      // Handles general connection or unexpected errors.
      setApiError(
        "Could not connect to the backend. Please make sure the backend server is running.",
      );

      // Stops loading state.
      setIsSubmitting(false);
      return;
    }

    // Stops loading state after successful request.
    setIsSubmitting(false);
  };

  // Resets form fields and result data.
  function handleReset() {
    // Clears application number.
    setApplicationNo("");

    // Clears date of birth.
    setDob("");

    // Clears validation errors.
    setErrors({});

    // Clears backend error.
    setApiError("");

    // Clears successful result data.
    setStatusData(null);

    // Resets loading state.
    setIsSubmitting(false);
  }

  // Renders the page UI.
  return (
    <main className="d-flex flex-column gap-4">
      {/* Top hero section */}
      <section className="cp-hero-section p-4 p-md-5 rounded-4">
        <div className="row align-items-center g-4">
          {/* Left content area */}
          <div className="col-12 col-lg-7">
            <h1 className="fw-bold mb-3">
              Track your loan application with clarity and confidence.
            </h1>

            <p className="mb-4">
              CreditPulse is a digital loan origination and credit assessment
              platform that helps applicants understand progress, next steps,
              and required actions in one place.
            </p>

            {/* Navigation buttons */}
            <div className="d-flex gap-2 flex-wrap mb-4">
              <Link className="btn btn-primary" href="/signup">
                Get Started
              </Link>

              <Link className="btn btn-outline-light" href="/about">
                Learn More
              </Link>

              <Link className="btn btn-outline-light" href="/contact">
                Contact Us
              </Link>
            </div>

            {/* Form displays before successful status response */}
            {!statusData && (
              <form
                className="row g-2"
                onSubmit={handleSubmit}
                aria-label="Check application status"
                noValidate
              >
                {/* Application number field */}
                <div className="col-12 col-md-5">
                  <input
                    type="text"
                    name="applicationNo"
                    className={`form-control ${
                      errors.applicationNo ? "is-invalid" : ""
                    }`}
                    placeholder="Application Number (e.g. APPL1234567890)"
                    aria-label="Application Number"
                    value={applicationNo}
                    onChange={(event) =>
                      handleApplicationNoChange(event.target.value)
                    }
                    disabled={isSubmitting}
                  />

                  {errors.applicationNo && (
                    <div className="invalid-feedback">
                      {errors.applicationNo}
                    </div>
                  )}
                </div>

                {/* Date of birth field */}
                <div className="col-12 col-md-4">
                  <input
                    type="date"
                    name="dob"
                    className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                    aria-label="Date of birth"
                    value={dob}
                    onChange={(event) => handleDobChange(event.target.value)}
                    disabled={isSubmitting}
                  />

                  {errors.dob && (
                    <div className="invalid-feedback">{errors.dob}</div>
                  )}
                </div>

                {/* Submit button */}
                <div className="col-12 col-md-3">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Checking..." : "Check Status"}
                  </button>
                </div>
              </form>
            )}

            {/* API error message */}
            {apiError && (
              <div className="alert alert-danger mt-3" role="alert">
                {apiError}
              </div>
            )}

            {/* Helper note shown before success */}
            {!statusData && (
              <p className="mt-3 mb-0">
                Tip: Enter the same application number and date of birth used
                during submission.
              </p>
            )}
          </div>

          {/* Right content card */}
          <div className="col-12 col-lg-5">
            {/* Intro card before success */}
            {!statusData ? (
              <div className="cp-card p-4 rounded-4">
                <h2 className="h4 fw-bold mb-3">Why CreditPulse?</h2>

                <ul className="mb-0">
                  <li className="mb-2">
                    Clear application stages and progress tracking
                  </li>
                  <li className="mb-2">
                    Fewer delays with timely document requests
                  </li>
                  <li className="mb-2">
                    Centralized dashboard for updates and actions
                  </li>
                  <li className="mb-0">
                    Designed for a smooth applicant experience
                  </li>
                </ul>
              </div>
            ) : (
              /* Dashboard card after success */
              <div className="cp-card p-4 rounded-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                  <div>
                    <h2 className="h4 fw-bold mb-1">Application Dashboard</h2>
                    <p className="mb-0 text-muted">
                      Latest application status details
                    </p>
                  </div>

                  <span className="badge text-bg-success px-3 py-2">
                    {statusData.statusName}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="mb-2">
                    <strong>Application Number:</strong>{" "}
                    {statusData.applicationNumber}
                  </p>

                  <p className="mb-2">
                    <strong>Status Code:</strong> {statusData.statusCode}
                  </p>

                  <p className="mb-0">
                    <strong>Current Stage:</strong> {statusData.statusName}
                  </p>
                </div>

                <div className="cp-card p-3 rounded-4 mb-3">
                  <h3 className="h6 fw-bold mb-2">What this means</h3>
                  <p className="mb-0">
                    Application details were found successfully in the system.
                    The current processing stage can now be reviewed.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleReset}
                >
                  Check Another Application
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Progress section shown only after success */}
      {statusData ? (
        <section className="cp-hero-section p-4 p-md-5 rounded-4">
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">Application Progress</h2>
            <p className="mb-0">
              Dashboard view based on the live API response.
            </p>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="cp-card p-4 rounded-4 h-100">
                <h3 className="h5 fw-bold mb-2">Verification</h3>
                <p className="mb-0">
                  Applicant identity and profile checks are tracked here.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="cp-card p-4 rounded-4 h-100">
                <h3 className="h5 fw-bold mb-2">Credit Review</h3>
                <p className="mb-0">
                  Credit and risk-related processing updates can be shown here.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="cp-card p-4 rounded-4 h-100">
                <h3 className="h5 fw-bold mb-2">Final Decision</h3>
                <p className="mb-0">
                  Approval, rejection, or pending action status can be displayed
                  here.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Process section shown before success */}
          <section className="cp-hero-section p-4 p-md-5 rounded-4">
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2">Steps away from getting approved</h2>
              <p className="mb-0">
                A simple process that keeps applicants informed from start to
                finish.
              </p>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="cp-card p-4 rounded-4 h-100">
                  <h3 className="h5 fw-bold mb-2">Create an account</h3>
                  <p className="mb-0">
                    Register to access the application dashboard securely.
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="cp-card p-4 rounded-4 h-100">
                  <h3 className="h5 fw-bold mb-2">Apply for a loan</h3>
                  <p className="mb-0">
                    Submit key details and start the origination process.
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="cp-card p-4 rounded-4 h-100">
                  <h3 className="h5 fw-bold mb-2">Upload documents</h3>
                  <p className="mb-0">
                    Provide required proofs when requested to avoid delays.
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="cp-card p-4 rounded-4 h-100">
                  <h3 className="h5 fw-bold mb-2">Track decision</h3>
                  <p className="mb-0">
                    See review status, verification updates, and final decision.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonial section shown before success */}
          <section className="cp-hero-section p-4 p-md-5 rounded-4">
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2">What users say</h2>
              <p className="mb-0">Built for transparency, speed, and trust.</p>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="cp-card p-4 rounded-4 h-100">
                  <h3 className="h5 fw-bold mb-2">Clear updates</h3>
                  <p className="mb-0">
                    “The stages were easy to understand. Every next step was
                    clear.”
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="cp-card p-4 rounded-4 h-100">
                  <h3 className="h5 fw-bold mb-2">Saves time</h3>
                  <p className="mb-0">
                    “Everything could be tracked from one dashboard without
                    calling support.”
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="cp-card p-4 rounded-4 h-100">
                  <h3 className="h5 fw-bold mb-2">Professional feel</h3>
                  <p className="mb-0">
                    “The interface feels modern and trustworthy, and the process
                    is easy to follow.”
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="cp-card p-4 rounded-4 h-100">
                  <h3 className="h5 fw-bold mb-2">Less confusion</h3>
                  <p className="mb-0">
                    “Application progress and document needs were much easier to
                    understand.”
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}