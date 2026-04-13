import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AuthProvider } from "../context/AuthContext";
import styles from "./layout.module.css";

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
          <div className={styles.siteShell}>
            <Navbar />
            <main className={`container py-4 ${styles.mainContent}`}>{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
