"use client";

import { useEffect, useState } from "react";

type ThemeToggleProps = {
  className?: string;
};

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") {
    return "dark";
  }

  return (localStorage.getItem("cp-theme") as "dark" | "light" | null) ?? "dark";
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("cp-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
