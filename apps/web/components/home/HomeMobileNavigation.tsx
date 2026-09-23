"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import styles from "./home-redesign.module.css";

type HomeMobileNavigationProps = {
  children: ReactNode;
};

function MenuMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function HomeMobileNavigation({ children }: HomeMobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.mobileToggle}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="home-mobile-navigation"
        onClick={() => setIsOpen((open) => !open)}
      >
        <MenuMark />
      </button>
      <div
        id="home-mobile-navigation"
        className={`${styles.mobileMenu}${isOpen ? ` ${styles.mobileMenuOpen}` : ""}`}
        aria-hidden={!isOpen}
        onClick={() => setIsOpen(false)}
      >
        {children}
      </div>
    </>
  );
}
