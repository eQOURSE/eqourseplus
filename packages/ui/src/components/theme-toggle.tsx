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
        <span className="eq-theme-toggle__label eq-theme-toggle__label--light">
          Light
        </span>
        <span className="eq-theme-toggle__label eq-theme-toggle__label--dark">
          Dark
        </span>
        <span className="eq-theme-toggle__thumb" />
      </span>
    </button>
  );
}
