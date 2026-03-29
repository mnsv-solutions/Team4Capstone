import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "CreditPulse",
  description: "A Digital Loan Origination & Credit Assessment Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <AuthProvider>
          <Navbar />

          <main className="container py-4">{children}</main>

          <footer className="cp-footer">
            <div className="container">
              <small>
                © {new Date().getFullYear()} CreditPulse. All rights reserved.
              </small>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}