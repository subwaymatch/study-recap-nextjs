"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "study-recap:theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Ignore storage errors.
  }
  return "system";
}

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // On mount, read stored theme and apply it.
  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(getResolvedTheme(stored));
  }, []);

  // Listen for system theme changes.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyTheme(getResolvedTheme("system"));
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const order: Theme[] = ["system", "light", "dark"];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      try {
        if (next === "system") {
          window.localStorage.removeItem(STORAGE_KEY);
        } else {
          window.localStorage.setItem(STORAGE_KEY, next);
        }
      } catch {
        // Ignore storage errors.
      }
      applyTheme(getResolvedTheme(next));
      return next;
    });
  }, []);

  const resolved = getResolvedTheme(theme);
  const label =
    theme === "system"
      ? `System (${resolved})`
      : theme === "light"
        ? "Light"
        : "Dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycleTheme}
      title={`Theme: ${label}`}
      aria-label={`Switch theme. Current: ${label}`}
    >
      {resolved === "dark" ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
      {theme === "system" && (
        <span className="theme-badge">auto</span>
      )}
    </button>
  );
}
