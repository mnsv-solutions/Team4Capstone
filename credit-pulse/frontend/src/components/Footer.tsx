import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import CreditPulseLogo from "./CreditPulseLogo";
import styles from "./Footer.module.css";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/signup", label: "Get Started" },
];

const supportItems = [
  {
    icon: Mail,
    label: "Email",
    value: "support@creditpulse.com",
    href: "mailto:support@creditpulse.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (000) 123-4567",
    href: "tel:+10001234567",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Conestoga College Capstone Project",
    href: "/about",
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <CreditPulseLogo showWordmark={false} className={styles.logo} />
            <div>
              <h2 className={styles.title}>CreditPulse</h2>
              <p className={styles.text}>
                A digital loan origination and credit assessment experience designed to keep
                applicants informed, supported, and confident at every step.
              </p>
            </div>
          </div>

          <div>
            <h3 className={styles.heading}>Quick Links</h3>
            <nav className={styles.links} aria-label="Footer navigation">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className={styles.heading}>Support</h3>
            <div className={styles.supportList}>
              {supportItems.map((item) => {
                const Icon = item.icon;

                return (
                  <a key={item.label} href={item.href} className={styles.supportItem}>
                    <span className={styles.icon} aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.value}</small>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className={styles.noteCard}>
            <span className={styles.badge}>
              <ShieldCheck size={16} />
              Applicant-first platform
            </span>
            <p className={styles.text}>
              Built to bring clarity to loan tracking, document readiness, and next-step guidance.
            </p>
            <Link href="/contact" className={styles.cta}>
              Contact Support
            </Link>
          </div>
        </div>

        <div className={styles.bottom}>
          <small>© {new Date().getFullYear()} CreditPulse. All rights reserved.</small>
          <small>Built for transparency, trust, and a smoother application journey.</small>
        </div>
      </div>
    </footer>
  );
}
