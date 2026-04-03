"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading, logout } = useAuth();

  const handleSignOut = () => {
    // Clears login session
    logout();

    // Moves user to sign in page
    router.push("/signin");
  };

  return (
    <nav className="navbar navbar-expand-lg cp-topbar">
      <div className="container">
        <Link className="cp-brand" href="/">
          CreditPulse
        </Link>

        <div className="navbar-nav ms-auto gap-2 align-items-lg-right">
          <Link className="nav-link cp-navlink" href="/">
            Home
          </Link>

          {!isLoading && isAuthenticated && (
            <>
              {isAdmin && (
                <Link className="nav-link cp-navlink" href="/admin">
                  Admin
                </Link>
              )}

              <Link className="nav-link cp-navlink" href="/dashboard">
                Dashboard
              </Link>

              <Link className="nav-link cp-navlink" href="/about">
                About Us
              </Link>

              <Link className="nav-link cp-navlink" href="/contact">
                Contact Us
              </Link>
            </>
          )}

          {!isLoading && !isAuthenticated && (
            <>
              <Link className="nav-link cp-navlink" href="/signin">
                Sign In
              </Link>

              <Link className="btn btn-primary cp-navbtn" href="/signup">
                Sign Up
              </Link>
            </>
          )}

          {!isLoading && isAuthenticated && (
            <button
              type="button"
              className="btn btn-primary cp-navbtn"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
