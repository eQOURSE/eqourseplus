"use client";

import { useEffect } from "react";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  isTheme,
  persistTheme,
  resolveTheme,
  type Theme,
} from "../theme/resolution";

function SunMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

function MoonMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" />
    </svg>
  );
}

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const storedTheme = readStoredTheme();
      if (!isTheme(storedTheme)) {
        applyTheme(
          document.documentElement,
          resolveTheme({
            isServer: false,
            storedTheme,
            systemPrefersDark: media.matches,
          }),
        );
      }
    };

    media.addEventListener?.("change", handleSystemChange);
    return () => media.removeEventListener?.("change", handleSystemChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = currentTheme() === "light" ? "dark" : "light";
    applyTheme(document.documentElement, nextTheme);
    try {
      persistTheme(window.localStorage, nextTheme);
    } catch {
      // The visual toggle remains usable when storage is blocked.
    }
  };

  return (
    <button
      type="button"
      className="eq-theme-toggle"
      aria-label="Toggle color theme"
      onClick={toggleTheme}
    >
      <span className="eq-theme-toggle__track" aria-hidden="true">
        <span className="eq-theme-toggle__label eq-theme-toggle__label--light ">
          <SunMark />
        </span>
        <span className="eq-theme-toggle__label eq-theme-toggle__label--dark ">
          <MoonMark />
        </span>
        <span className="eq-theme-toggle__thumb" />
      </span>
    </button>
  );
}
