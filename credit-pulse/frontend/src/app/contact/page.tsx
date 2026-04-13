"use client";

import { useState, type FormEvent } from "react";
import { Clock3, Mail, MapPin, MessageSquareMore, Phone, Send, ShieldCheck } from "lucide-react";
import styles from "./page.module.css";

type ContactForm = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

type ContactErrors = Partial<Record<keyof ContactForm, string>>;

const faqItems = [
  {
    title: "How can I check my loan status?",
    answer:
      "Use the status check feature on the homepage with your application number and date of birth.",
  },
  {
    title: "How long does approval take?",
    answer:
      "Processing times vary based on verification and documentation, and progress updates are shown as the review moves forward.",
  },
  {
    title: "What documents are usually required?",
    answer:
      "Typical requests may include identity proof, income verification, and address-related documents depending on the application.",
  },
  {
    title: "Who should I contact for help?",
    answer:
      "You can send a message through the form below or use the support email and phone details on this page.",
  },
];

const supportChannels = [
  {
    icon: Mail,
    label: "Email support",
    value: "support@creditpulse.com",
    detail: "Best for general questions and application follow-up.",
  },
  {
    icon: Phone,
    label: "Phone support",
    value: "+1 (000) 123-4567",
    detail: "Available during regular business hours for urgent help.",
  },
  {
    icon: Clock3,
    label: "Response window",
    value: "Within 24-48 hours",
    detail: "We aim to respond quickly with the right next step.",
  },
];

const defaultForm: ContactForm = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(defaultForm);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  function validateForm(values: ContactForm) {
    const nextErrors: ContactErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!values.subject.trim()) {
      nextErrors.subject = "Please enter a subject.";
    }

    if (!values.message.trim()) {
      nextErrors.message = "Please enter your message.";
    } else if (values.message.trim().length < 10) {
      nextErrors.message = "Please add a little more detail so we can help properly.";
    }

    return nextErrors;
  }

  function handleChange(field: keyof ContactForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setIsSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitted(true);
    setForm(defaultForm);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Contact CreditPulse</span>
          <h1>Questions about your application journey? We are here to help.</h1>
          <p>
            Reach out for support, product questions, or application guidance. The page is designed
            to make it easy to find help without losing context.
          </p>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.heroPanelCard}>
            <ShieldCheck size={20} />
            <div>
              <strong>Applicant-first support</strong>
              <span>Clear guidance, faster follow-up, and better visibility into next steps.</span>
            </div>
          </div>
          <div className={styles.heroMeta}>
            <span><MapPin size={16} /> Conestoga College Capstone Project</span>
            <span><MessageSquareMore size={16} /> Support for platform and application questions</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.layoutGrid}>
          <article className={styles.formCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardEyebrow}>Send a message</span>
              <h2>Tell us how we can help</h2>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.formRow}>
                <div>
                  <label htmlFor="fullName" className={styles.label}>Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={(event) => handleChange("fullName", event.target.value)}
                  />
                  {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
                </div>

                <div>
                  <label htmlFor="email" className={styles.label}>Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
              </div>

              <div>
                <label htmlFor="subject" className={styles.label}>Subject</label>
                <input
                  id="subject"
                  type="text"
                  className={`form-control ${errors.subject ? "is-invalid" : ""}`}
                  placeholder="What do you need help with?"
                  value={form.subject}
                  onChange={(event) => handleChange("subject", event.target.value)}
                />
                {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
              </div>

              <div>
                <label htmlFor="message" className={styles.label}>Message</label>
                <textarea
                  id="message"
                  className={`form-control ${errors.message ? "is-invalid" : ""}`}
                  rows={5}
                  placeholder="Write your message here..."
                  value={form.message}
                  onChange={(event) => handleChange("message", event.target.value)}
                />
                {errors.message && <div className="invalid-feedback">{errors.message}</div>}
              </div>

              <button type="submit" className="btn btn-primary">
                <Send size={16} />
                Submit Message
              </button>

              {isSubmitted && (
                <div className="alert alert-success mb-0" role="status">
                  Your message has been captured successfully. Our team will follow up soon.
                </div>
              )}
            </form>
          </article>

          <aside className={styles.sidePanel}>
            <article className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardEyebrow}>Get in touch</span>
                <h2>Support channels</h2>
              </div>

              <div className={styles.supportList}>
                {supportChannels.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className={styles.supportItem}>
                      <span className={styles.supportIcon}>
                        <Icon size={18} />
                      </span>
                      <div>
                        <strong>{item.label}</strong>
                        <p>{item.value}</p>
                        <small>{item.detail}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.faqHeader}>
          <span className={styles.eyebrow}>Frequently asked questions</span>
          <h2>Helpful answers before you contact support</h2>
        </div>

        <div className={styles.faqGrid}>
          {faqItems.map((item) => (
            <article key={item.title} className={styles.faqCard}>
              <h3>{item.title}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
