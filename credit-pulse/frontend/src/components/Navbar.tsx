"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import CreditPulseLogo from "./CreditPulseLogo";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

type NavItem = {
  href: string;
  label: string;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = useMemo<NavItem[]>(() => {
    const baseItems: NavItem[] = [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ];

    if (isAuthenticated) {
      return [
        ...baseItems,
        {
          href: isAdmin ? "/admin" : "/dashboard",
          label: isAdmin ? "Admin" : "Dashboard",
        },
      ];
    }

    return baseItems;
  }, [isAdmin, isAuthenticated]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      if (!token) {
        console.error("Sign out skipped because no access token was found.");
        logout();
        closeMenu();
        router.push("/signin");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/signout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      logout();
      closeMenu();
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
    <nav className={styles.topbar}>
      <div className={`container ${styles.navShell}`}>
        <CreditPulseLogo className={styles.navBrand} />

        <button
          type="button"
          className={styles.navToggle}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((previous) => !previous)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`${styles.navMenu} ${isMenuOpen ? styles.navMenuOpen : ""}`}>
          <div className={styles.navLinks}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  className={`${styles.navlink} ${isActive ? styles.navlinkActive : ""}`}
                  href={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className={styles.navActions}>
            {!isLoading && !isAuthenticated && (
              <>
                <Link className={styles.navlink} href="/signin" onClick={closeMenu}>
                  Sign In
                </Link>

                <Link
                  className={`btn btn-primary ${styles.navButton}`}
                  href="/signup"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}

            {!isLoading && isAuthenticated && (
              <button
                type="button"
                className={`btn btn-primary ${styles.navButton}`}
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </button>
            )}

            <ThemeToggle className={styles.themeButton} />
          </div>
        </div>
      </div>
    </nav>
  );
}
