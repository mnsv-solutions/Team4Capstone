import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreditPulse",
  description: "Sprint 0 UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="container">
            <div className="clearfix topbar-row">
              <div className="logo-wrap">
                <Link href="/" className="logo-box">
                  Logo
                </Link>
              </div>

              <nav className="nav" aria-label="Primary">
                <Link href="/">Home</Link>
                <Link href="/about">About Us</Link>
                <Link href="/contact">Contact Us</Link>
                <Link href="/signin">Sign In</Link>
                <Link href="/signup" className="cta">
                  Sign Up
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="page">
          <div className="container">{children}</div>
        </main>

        <footer className="footer">Footer</footer>
      </body>
    </html>
  );
}
