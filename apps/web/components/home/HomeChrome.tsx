"use client";

import type { AuthSession } from "@eqourse/shared";
import { applyTheme, isTheme, persistTheme, type Theme } from "@eqourse/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  IconArrow,
  IconArrowUpRight,
  IconClose,
  IconMenu,
  IconMoon,
  IconSun,
  SEGMENT_ICONS,
} from "../landing/icons";
import { LiquidGlass } from "../landing/liquid-glass";
import { ACCESS, LOGIN, SEGMENTS } from "../landing/segments";

export const NAV_LINKS = [
  { label: "Solutions", href: "/clients", page: "clients" },
  { label: "Experts", href: "/freelancers", page: "freelancers" },
  { label: "Vendors", href: "/vendors", page: "vendors" },
  { label: "About", href: "/about", page: "about" },
] as const;

type ActivePage = "about" | "vendors" | "freelancers" | "clients";

function BrandMark({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={`q-brand${onDark ? " q-brand--on-dark" : ""}`}>
      {/* Cropped copies of the brand artwork: the originals carry ~15% empty margin. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="q-brand__light" src="/brand/eqourse-plus-tight.svg" alt="eQOURSE Logo" width={226} height={79} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="q-brand__dark" src="/brand/eqourse-plus-on-dark-tight.svg" alt="" aria-hidden="true" width={226} height={79} />
    </span>
  );
}

export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.dataset.theme ?? null;
    if (isTheme(current)) setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(document.documentElement, next);
    try {
      persistTheme(window.localStorage, next);
    } catch {
      /* storage unavailable: the theme still applies for this visit */
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Dark theme"
      className="q-theme"
      data-theme-state={theme}
      onClick={toggle}
    >
      <span className="q-theme__track" aria-hidden="true">
        <IconSun className="q-theme__sun" />
        <IconMoon className="q-theme__moon" />
        <span className="q-theme__thumb" />
      </span>
    </button>
  );
}

function SegmentMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="q-segmenu" aria-label="Choose how you join eQOURSE+">
      {SEGMENTS.map((item) => {
        const Icon = SEGMENT_ICONS[item.id];
        return (
          <li key={item.id}>
            <Link href={item.href} className={`q-segmenu__item q-segmenu__item--${item.id}`} onClick={onNavigate}>
              <span className="q-segmenu__icon"><Icon /></span>
              <span className="q-segmenu__text">
                <small>{item.audience}</small>
                <strong>{item.cta}</strong>
              </span>
              <IconArrowUpRight className="q-segmenu__go" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type HomeHeaderProps = {
  brandHref?: string;
  activePage?: ActivePage;
} & ({ session?: null; onSignOut?: never } | { session: AuthSession; onSignOut: () => void });

export function HomeHeader({ brandHref = "/", activePage, ...auth }: HomeHeaderProps = {}) {
  const session = "session" in auth ? auth.session : null;
  const onSignOut = "onSignOut" in auth ? auth.onSignOut : undefined;
  const authenticated = Boolean(session);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sheetTab = open ? undefined : -1;

  return (
    <header className="q-header q" data-scrolled={scrolled} data-open={open}>
      <LiquidGlass
        as="nav"
        id="site-navigation"
        className="q-nav"
        tier="focal"
        radius={33}
        bezel={18}
        thickness={20}
        data-home-region
        aria-labelledby="site-navigation-title"
      >
        <span id="site-navigation-title" className="sr-only">Primary navigation</span>
        <a className="q-nav__brand" href={brandHref} aria-label="eQOURSE+">
          <BrandMark />
        </a>

        <div className="q-nav__links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} aria-current={activePage === link.page ? "page" : undefined}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="q-nav__actions">
          <ThemeSwitch />
          {authenticated ? (
            <>
              <span className="q-nav__user" aria-label="Signed in user">{session?.email}</span>
              <button type="button" className="q-btn q-btn--outline q-nav__signout" onClick={onSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link className="q-btn q-btn--ghost q-nav__login" href={LOGIN.href}>{LOGIN.label}</Link>
              <div className="q-nav__access">
                <Link className="q-btn q-btn--primary" href={ACCESS.href}>
                  {ACCESS.label}
                  <span className="q-btn__icon"><IconArrow /><IconArrow /></span>
                </Link>
                <div className="q-nav__panel">
                  <p className="q-nav__panel-title q-mono">Choose your path</p>
                  <SegmentMenu />
                </div>
              </div>
            </>
          )}
          <button
            type="button"
            className="q-nav__toggle"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="home-mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </LiquidGlass>

      <div
        id="home-mobile-navigation"
        className="q-sheet"
        aria-hidden={!open}
        onClick={(event) => {
          if ((event.target as Element).closest("a")) setOpen(false);
        }}
      >
        <div className="q-sheet__links">
          {NAV_LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="q-display"
              style={{ ["--i" as string]: index }}
              tabIndex={sheetTab}
              aria-current={activePage === link.page ? "page" : undefined}
            >
              {link.label}
              <IconArrowUpRight />
            </a>
          ))}
        </div>
        {!authenticated ? (
          <>
            <p className="q-sheet__label q-mono">Choose your path</p>
            <div className="q-sheet__segments">
              {SEGMENTS.map((item) => {
                const Icon = SEGMENT_ICONS[item.id];
                return (
                  <a key={item.id} className={`q-sheet__segment q-sheet__segment--${item.id}`} href={item.href} tabIndex={sheetTab}>
                    <span className="q-sheet__segment-icon"><Icon /></span>
                    <span>
                      <small>{item.audience}</small>
                      {item.cta}
                    </span>
                    <IconArrow />
                  </a>
                );
              })}
            </div>
            <div className="q-sheet__auth">
              <a className="q-btn q-btn--outline" href={LOGIN.href} tabIndex={sheetTab}>{LOGIN.label}</a>
              <a className="q-btn q-btn--primary" href={ACCESS.href} tabIndex={sheetTab}>{ACCESS.label}</a>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}

export const FOOTER_COLUMNS: ReadonlyArray<readonly [string, ReadonlyArray<readonly [string, string | null]>]> = [
  [
    "Platform",
    [
      ["About eQOURSE+", "/about"],
      ["How It Works", "/#how-it-works"],
      ["Glass Box Architecture", "/#glass-box"],
      ["Quality and Rigor", "/#trust"],
      ["Trust and Provenance", "/#trust"],
      ["FAQ", "/#faq"],
    ],
  ],
  [
    "Experts",
    [
      ["Join as a Specialist", "/register/freelancer"],
      ["Specialist Pathways", "/freelancers"],
      ["Verification and Calibration", "/freelancers"],
      ["Domains and Expertise", "/#how-it-works"],
      ["Earnings and Clarity", "/freelancers"],
    ],
  ],
  [
    "Vendors",
    [
      ["Join as a Vendor", "/register/vendor"],
      ["Vendor Network", "/vendors"],
      ["Onboarding and Capability", "/vendors"],
      ["Structured Delivery", "/vendors"],
      ["Agency Partnership", "/vendors"],
    ],
  ],
  [
    "Legal",
    [
      ["Privacy Policy", null],
      ["Terms of Service", null],
      ["Cookie Policy", null],
      ["Data Protection", null],
      ["Acceptable Use Policy", null],
    ],
  ],
];

export function HomeFooter() {
  return (
    <footer id="site-footer" className="q-footer q q-scope-dark" data-home-region aria-labelledby="footer-title">
      <div className="q-footer__glow" aria-hidden="true" />
      <div className="q-footer__grid" aria-hidden="true"><span className="q-plusgrid" /></div>
      <div className="q-container">
        <div className="q-footer__top">
          <div className="q-footer__brand">
            <BrandMark onDark />
            <h2 id="footer-title" className="q-display q-footer__title">
              eQOURSE+ — the talent platform by <span className="q-footer__accent">eQOURSE</span>
            </h2>
            <p className="q-footer__lede">
              Connecting verified specialists, partner agencies and enterprise
              teams for AI training and global content projects.
            </p>
            <div className="q-footer__ctas">
              {SEGMENTS.map((item) => (
                <Link key={item.id} href={item.href} className={`q-footer__cta q-footer__cta--${item.id}`}>
                  <span>{item.cta}</span>
                  <IconArrowUpRight />
                </Link>
              ))}
              <Link href={LOGIN.href} className="q-footer__cta q-footer__cta--quiet">
                <span>{LOGIN.label}</span>
                <IconArrowUpRight />
              </Link>
            </div>
          </div>

          <nav className="q-footer__cols" aria-label="Footer">
            {FOOTER_COLUMNS.map(([heading, items]) => (
              <div className="q-footer__col" key={heading}>
                <h3 className="q-mono">{heading}</h3>
                <ul>
                  {items.map(([label, href]) => (
                    <li key={label}>
                      {href ? <Link href={href}>{label}</Link> : <span>{label}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="q-footer__bottom">
          <p>
            eQOURSE+ is an enterprise division of eQOURSE. Certified ISO 9001:2015 &amp; ISO 27001:2013.
            Operating across Singapore &amp; India.
          </p>
          <a className="q-footer__parent" href="https://www.eqourse.com/" aria-label="Visit eQOURSE">
            Visit eQOURSE <IconArrowUpRight />
          </a>
        </div>
      </div>
      <div className="q-footer__word q-display" aria-hidden="true">
        eQOURSE<span>+</span>
      </div>
    </footer>
  );
}

/** Every destination the shared public header and footer can link to. */
export const PUBLIC_CHROME_HREFS: readonly string[] = Array.from(
  new Set([
    "/",
    ...NAV_LINKS.map((link) => link.href),
    LOGIN.href,
    ACCESS.href,
    ...SEGMENTS.map((item) => item.href),
    ...FOOTER_COLUMNS.flatMap(([, items]) => items.map(([, href]) => href)).filter(
      (href): href is string => href !== null,
    ),
    "https://www.eqourse.com/",
  ]),
);
