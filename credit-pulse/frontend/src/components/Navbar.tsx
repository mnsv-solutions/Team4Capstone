"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      if (!token) {
        console.error("Sign out skipped because no access token was found.");
        logout();
        router.push("/signin");
        return;
      }

      await axios.post(
        "/api/auth/signout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      logout();
      router.push("/signin");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Sign out API failed:",
          error.response?.status,
          error.response?.data,
        );
      } else {
        console.error("Sign out API failed:", error);
      }
    } finally {
      setIsSigningOut(false);
    }
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
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
