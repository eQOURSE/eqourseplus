"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type MobileNavigationProps = {
  children: ReactNode;
  actions: ReactNode;
};

function MenuMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
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

export function MobileNavigation({ children, actions }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div
        id="site-navigation-links"
        className={`home-nav-links${isMenuOpen ? " is-open" : ""}`}
        onClick={() => setIsMenuOpen(false)}
      >
        {children}
      </div>
      <div className="home-nav-actions">
        {actions}
        <button
          type="button"
          className="home-menu-toggle"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="site-navigation-links"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <MenuMark />
        </button>
      </div>
    </>
  );
}
