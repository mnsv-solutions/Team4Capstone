import Link from "next/link";
import styles from "./CreditPulseLogo.module.css";

type CreditPulseLogoProps = {
  href?: string;
  className?: string;
  showWordmark?: boolean;
};

export default function CreditPulseLogo({
  href = "/",
  className = "",
  showWordmark = true,
}: CreditPulseLogoProps) {
  return (
    <Link
      className={`${styles.logo} ${className}`.trim()}
      href={href}
      aria-label="CreditPulse home"
    >
      <span className={styles.mark} aria-hidden="true">
        <svg
          viewBox="0 0 64 64"
          role="img"
          focusable="false"
          className={styles.svg}
        >
          <defs>
            <linearGradient id="cp-logo-gradient" x1="10" y1="12" x2="54" y2="52">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          <rect
            x="6"
            y="6"
            width="52"
            height="52"
            rx="16"
            fill="#0f172a"
            stroke="url(#cp-logo-gradient)"
            strokeWidth="3"
          />

          <path
            d="M40 17.5a16 16 0 1 0 0 29"
            fill="none"
            stroke="#dbeafe"
            strokeWidth="5"
            strokeLinecap="round"
          />

          <path
            d="M18 34h8l4-8 5 14 5-10h6"
            fill="none"
            stroke="url(#cp-logo-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M39 24.5h8"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {showWordmark && (
        <span className={styles.wordmark}>
          <span className={styles.title}>CreditPulse</span>
          <span className={styles.tag}>Loans tracked with clarity</span>
        </span>
      )}
    </Link>
  );
}
