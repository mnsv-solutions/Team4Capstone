import type { Metadata } from "next";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import ThemeToggle from "../components/ThemeToggle";

export const metadata: Metadata = {
  title: "CreditPulse",
  description: "A Digital Loan Origination & Credit Assessment Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <nav className="navbar navbar-expand-lg cp-topbar">
          <div className="container">
            <Link className="cp-brand" href="/">
              CreditPulse
            </Link>

            <div className="navbar-nav ms-auto gap-2 align-items-lg-right">
              <Link className="nav-link cp-navlink" href="/">
                Home
              </Link>
               <Link className="nav-link cp-navlink" href="/dashboard">
                Dashboard
              </Link>
              <Link className="nav-link cp-navlink" href="/about">
                About Us
              </Link>
              <Link className="nav-link cp-navlink" href="/contact">
                Contact Us
              </Link>
              <Link className="nav-link cp-navlink" href="/signin">
                Sign In
              </Link>
              <Link className="btn btn-primary cp-navbtn" href="/signup">
                Sign Up
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <main className="container py-4">{children}</main>

        <footer className="cp-footer">
          <div className="container">
            <small>© {new Date().getFullYear()} CreditPulse. All rights reserved.</small>
          </div>
        </footer>
      </body>
    </html>
  );
}