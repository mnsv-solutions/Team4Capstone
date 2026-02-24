"use client";

import { useEffect, useState } from "react";

/*
  ThemeToggle Component

  This component controls the Light and Dark theme of the application.
  It updates the data-theme attribute on the <html> element.

  The selected theme is saved in localStorage
  so it persists after page refresh.
*/

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("cp-theme") as "dark" | "light" | null) ?? "dark";

    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("cp-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <button
      type="button"
      className="cp-theme-btn"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}