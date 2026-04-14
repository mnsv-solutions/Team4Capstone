"use client";

// This is the public home page that introduces CreditPulse and lets users check application status.
import axios from "axios";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, BellRing, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./page.module.css";

type FormErrors = {
  applicationNo?: string;
  dob?: string;
};

type StatusResponse = {
  success: boolean;
  applicationNumber?: string;
  statusCode?: string;
  statusName?: string;
  reasonCode?: string;
};

// These cards explain the main benefits applicants get from the platform.
const experienceHighlights = [
  {
    icon: ShieldCheck,
    title: "Clear application visibility",
    description: "See your current stage, recent activity, and what the platform needs from you next.",
  },
  {
    icon: FileCheck2,
    title: "Smarter document readiness",
    description: "Prepare required details early and reduce avoidable back-and-forth during review.",
  },
  {
    icon: BellRing,
    title: "Helpful next-step guidance",
    description: "CreditPulse focuses on keeping applicants informed instead of leaving them guessing.",
  },
];

// These short steps summarize the loan journey shown on the home page.
const processSteps = [
  "Create your account and start a secure application.",
  "Submit key details and track status updates clearly.",
  "Respond to document or verification requests faster.",
  "Follow approval progress with more confidence.",
];

// These quotes reinforce the product tone and user-experience goals.
const testimonials = [
  {
    title: "Clear updates",
    quote: "The stages were easy to understand, and the next step always felt obvious.",
  },
  {
    title: "Less confusion",
    quote: "Everything important was visible in one place instead of being spread across messages.",
  },
  {
    title: "Faster follow-up",
    quote: "Document requests and review progress felt much more organized than a typical loan flow.",
  },
];

export default function HomePage() {
  const [applicationNo, setApplicationNo] = useState("");
  const [dob, setDob] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function isAdult(dateString: string) {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age = age - 1;
    }

    return age >= 18;
  }

  function validateForm() {
    const newErrors: FormErrors = {};
    const trimmedApplicationNo = applicationNo.trim();

    if (!trimmedApplicationNo) {
      newErrors.applicationNo = "Please enter your application number.";
    } else if (!/^APPL\d{10}$/.test(trimmedApplicationNo)) {
      newErrors.applicationNo =
        "Application number must start with APPL and contain exactly 10 digits after it.";
    }

    if (!dob) {
      newErrors.dob = "Please select your date of birth.";
    } else {
      const birthDate = new Date(dob);
      const today = new Date();

      if (Number.isNaN(birthDate.getTime())) {
        newErrors.dob = "Please enter a valid date of birth.";
      } else if (birthDate > today) {
        newErrors.dob = "Date of birth cannot be in the future.";
      } else if (!isAdult(dob)) {
        newErrors.dob = "You must be at least 18 years old.";
      }
    }

    return newErrors;
  }

  function handleApplicationNoChange(value: string) {
    // Normalizes the application number and clears the matching field error.
    const cleanValue = value.replace(/\s+/g, "").toUpperCase();
    setApplicationNo(cleanValue);
    setErrors((previousErrors) => ({
      ...previousErrors,
      applicationNo: undefined,
    }));
    setApiError("");
  }

  function handleDobChange(value: string) {
    // Updates the date of birth and clears the related error message.
    setDob(value);
    setErrors((previousErrors) => ({
      ...previousErrors,
      dob: undefined,
    }));
    setApiError("");
  }

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Submits the status-check form and shows the latest application state.
    event.preventDefault();
    if (isSubmitting) return;

    setApiError("");
    setStatusData(null);

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post<StatusResponse>("/api/application-status", {
        applicationNumber: applicationNo.trim(),
        dob,
      });

      setStatusData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const reasonCode = error.response?.data?.reasonCode;
        setApiError(getApiErrorMessage(reasonCode));
        setIsSubmitting(false);
        return;
      }

      setApiError(
        "Could not connect to the backend. Please make sure the backend server is running.",
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  function handleReset() {
    // Resets the status checker back to its initial empty state.
    setApplicationNo("");
    setDob("");
    setErrors({});
    setApiError("");
    setStatusData(null);
    setIsSubmitting(false);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Check application status</span>
          <h1 className={styles.heroTitle}>Check your loan application status with clarity and confidence.</h1>
          <p className={styles.heroText}>
            CreditPulse helps you check your current stage, understand progress updates, and see
            the next steps for your application in one place.
          </p>

          <div className={styles.heroActions}>
            <Link className="btn btn-primary" href="/signup">
              Get Started
            </Link>
            <Link className={styles.secondaryAction} href="/about">
              Learn More
              <ArrowRight size={16} />
            </Link>
            <Link className={styles.secondaryAction} href="/contact">
              Contact Us
            </Link>
          </div>

          <div className={styles.highlightGrid}>
            {experienceHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className={styles.highlightCard}>
                  <span className={styles.highlightIcon}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

      </section>

      <section className={styles.statusSection}>
        {!statusData ? (
          <div className={styles.statusCard}>
            <div className={styles.statusCardHeader}>
              <div>
                <span className={styles.cardEyebrow}>Application lookup</span>
                <h2>Check your application status</h2>
                <p className={styles.statusIntro}>
                  Enter your application number and date of birth to view your latest progress.
                </p>
              </div>
              <span className={styles.liveBadge}>
                <Sparkles size={14} />
                Live check
              </span>
            </div>

            <div className={styles.statusMeta}>
              <span>Secure lookup</span>
              <span>Fast status check</span>
              <span>Clear next steps</span>
            </div>

            <form className={styles.statusForm} onSubmit={handleSubmit} noValidate>
              <div>
                <label className={styles.fieldLabel} htmlFor="applicationNo">
                  Application Number
                </label>
                <input
                  id="applicationNo"
                  type="text"
                  name="applicationNo"
                  className={`form-control ${errors.applicationNo ? "is-invalid" : ""}`}
                  placeholder="APPL1234567890"
                  aria-label="Application Number"
                  value={applicationNo}
                  onChange={(event) => handleApplicationNoChange(event.target.value)}
                  disabled={isSubmitting}
                />
                {errors.applicationNo && (
                  <div className="invalid-feedback">{errors.applicationNo}</div>
                )}
              </div>

              <div>
                <label className={styles.fieldLabel} htmlFor="dob">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                  aria-label="Date of birth"
                  value={dob}
                  onChange={(event) => handleDobChange(event.target.value)}
                  disabled={isSubmitting}
                />
                {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                {isSubmitting ? "Checking..." : "Check Status"}
              </button>
            </form>

            {apiError && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                {apiError}
              </div>
            )}

            <p className={styles.helperText}>
              Tip: Use the same application number and date of birth submitted during your loan
              application.
            </p>
          </div>
        ) : (
          <div className={styles.statusCard}>
            <div className={styles.statusCardHeader}>
              <div>
                <span className={styles.cardEyebrow}>Application dashboard</span>
                <h2>{statusData.statusName}</h2>
                <p className={styles.statusIntro}>
                  Your latest application details were found successfully.
                </p>
              </div>
              <span className={styles.successBadge}>
                <BadgeCheck size={14} />
                Status found
              </span>
            </div>

            <div className={styles.statusSummary}>
              <div>
                <span>Application Number</span>
                <strong>{statusData.applicationNumber}</strong>
              </div>
              <div>
                <span>Status Code</span>
                <strong>{statusData.statusCode}</strong>
              </div>
              <div>
                <span>Current Stage</span>
                <strong>{statusData.statusName}</strong>
              </div>
            </div>

            <div className={styles.statusMessage}>
              <h3>What this means</h3>
              <p>
                Application details were found successfully in the system. Review the current
                stage and continue with any remaining steps if needed.
              </p>
            </div>

            <button type="button" className="btn btn-outline-primary" onClick={handleReset}>
              Check Another Application
            </button>
          </div>
        )}
      </section>

      {statusData ? (
        <section className={styles.section}>
          <div className={styles.sectionHeaderCentered}>
            <span className={styles.eyebrow}>Application overview</span>
            <h2>Progress areas to review</h2>
            <p>Dashboard blocks can present live updates as your application moves through review.</p>
          </div>

          <div className={styles.infoGrid}>
            <article className={styles.infoCard}>
              <h3>Verification</h3>
              <p>Applicant identity and profile checks can be surfaced in one clear view.</p>
            </article>
            <article className={styles.infoCard}>
              <h3>Credit Review</h3>
              <p>Credit and risk-related assessments can be tracked with easier status visibility.</p>
            </article>
            <article className={styles.infoCard}>
              <h3>Final Decision</h3>
              <p>Approval, rejection, or pending-action updates can be shown with next-step guidance.</p>
            </article>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.eyebrow}>How it works</span>
              <h2>A simple process that keeps applicants informed.</h2>
            </div>

            <div className={styles.processGrid}>
              {processSteps.map((step, index) => (
                <article key={step} className={styles.processCard}>
                  <span className={styles.processNumber}>0{index + 1}</span>
                  <p>{step}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeaderCentered}>
              <span className={styles.eyebrow}>What users value</span>
              <h2>Built for transparency, speed, and trust.</h2>
            </div>

            <div className={styles.testimonialGrid}>
              {testimonials.map((item) => (
                <article key={item.title} className={styles.testimonialCard}>
                  <span className={styles.quoteMark}>&ldquo;</span>
                  <h3>{item.title}</h3>
                  <p>{item.quote}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.ctaSection}>
            <div>
              <span className={styles.eyebrow}>Need help?</span>
              <h2>Questions about your application journey?</h2>
              <p>
                Explore the platform, learn how the process works, or speak with the team for more
                support.
              </p>
            </div>

            <div className={styles.ctaActions}>
              <Link className="btn btn-primary" href="/signup">
                Create an Account
              </Link>
              <Link className={styles.secondaryAction} href="/contact">
                Talk to Support
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

