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
import { LiquidLens } from "../landing/liquid-lens";
import { ACCESS, LOGIN, SEGMENTS } from "../landing/segments";

export const NAV_LINKS = [
  { label: "Solutions", href: "/clients", page: "clients" },
  { label: "Experts", href: "/freelancers", page: "freelancers" },
  { label: "Vendors", href: "/vendors", page: "vendors" },
  { label: "About", href: "/about", page: "about" },
] as const;

type ActivePage = "about" | "vendors" | "freelancers" | "clients";

function BrandMark({ footer = false }: { footer?: boolean }) {
  return (
    <span className={`lx-brand${footer ? " lx-brand--footer" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lx-brand__light" src="/brand/eqourse-plus.svg" alt="eQOURSE Logo" width={271} height={109} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lx-brand__dark" src="/brand/eqourse-plus-on-dark.svg" alt="" aria-hidden="true" width={271} height={109} />
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
      /* storage unavailable — theme still applies for this visit */
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Dark theme"
      className="lx-theme"
      data-theme-state={theme}
      onClick={toggle}
    >
      <span className="lx-theme__thumb" aria-hidden="true">
        <IconSun className="lx-theme__sun" />
        <IconMoon className="lx-theme__moon" />
      </span>
    </button>
  );
}

function SegmentMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="lx-segmenu" aria-label="Choose how you join eQOURSE+">
      {SEGMENTS.map((item) => {
        const Icon = SEGMENT_ICONS[item.id];
        return (
          <li key={item.id}>
            <Link href={item.href} className="lx-segmenu__item" onClick={onNavigate}>
              <span className={`lx-segmenu__icon lx-seg-${item.id}`}><Icon /></span>
              <span className="lx-segmenu__text">
                <small>{item.audience}</small>
                <strong>{item.cta}</strong>
              </span>
              <IconArrowUpRight className="lx-segmenu__go" />
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="lx-header lx" data-scrolled={scrolled} data-open={open}>
      <LiquidLens
        as="nav"
        id="site-navigation"
        className="lx-nav lx-glass"
        data-home-region
        aria-labelledby="site-navigation-title"
        radius={999}
        bezel={18}
        strength={38}
      >
        <span id="site-navigation-title" className="sr-only">Primary navigation</span>
        <a className="lx-nav__brand" href={brandHref} aria-label="eQOURSE+">
          <BrandMark />
        </a>

        <div className="lx-nav__links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} aria-current={activePage === link.page ? "page" : undefined}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="lx-nav__actions">
          <ThemeSwitch />
          {authenticated ? (
            <>
              <span className="lx-nav__user" aria-label="Signed in user">{session?.email}</span>
              <button type="button" className="lx-btn lx-btn--glass" onClick={onSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link className="lx-btn lx-btn--ghost lx-nav__login" href={LOGIN.href}>{LOGIN.label}</Link>
              <div className="lx-nav__access">
                <Link className="lx-btn lx-btn--primary" href={ACCESS.href} aria-haspopup="true">
                  {ACCESS.label}
                  <span className="lx-btn__arrow"><IconArrow /></span>
                </Link>
                <div className="lx-nav__panel lx-glass">
                  <p className="lx-nav__panel-title">Choose your path</p>
                  <SegmentMenu />
                </div>
              </div>
            </>
          )}
          <button
            type="button"
            className="lx-nav__toggle"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="home-mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </LiquidLens>

      <div
        id="home-mobile-navigation"
        className="lx-sheet lx-glass"
        aria-hidden={!open}
        onClick={(event) => {
          if ((event.target as Element).closest("a")) setOpen(false);
        }}
      >
        <div className="lx-sheet__links">
          {NAV_LINKS.map((link, index) => (
            <a key={link.href} href={link.href} style={{ ["--i" as string]: index }} tabIndex={open ? undefined : -1}>
              {link.label}
              <IconArrowUpRight />
            </a>
          ))}
        </div>
        {!authenticated ? (
          <>
            <div className="lx-sheet__segments">
              {SEGMENTS.map((item) => (
                <a key={item.id} className="lx-btn lx-btn--glass" href={item.href} tabIndex={open ? undefined : -1}>
                  {item.cta}
                  <span className="lx-btn__arrow"><IconArrow /></span>
                </a>
              ))}
            </div>
            <div className="lx-sheet__auth">
              <a className="lx-btn lx-btn--ghost" href={LOGIN.href} tabIndex={open ? undefined : -1}>{LOGIN.label}</a>
              <a className="lx-btn lx-btn--primary" href={ACCESS.href} tabIndex={open ? undefined : -1}>{ACCESS.label}</a>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}

export const FOOTER_COLUMNS: ReadonlyArray<readonly [string, ReadonlyArray<readonly [string, string | null]>]> = [
  [
    "PLATFORM",
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
    "SPECIALISTS",
    [
      ["Join as a Specialist", "/register/freelancer"],
      ["Specialist Pathways", "/freelancers"],
      ["Verification and Calibration", "/freelancers"],
      ["Domains and Expertise", "/#how-it-works"],
      ["Earnings and Clarity", "/freelancers"],
    ],
  ],
  [
    "VENDORS",
    [
      ["Join as a Vendor", "/register/vendor"],
      ["Vendor Network", "/vendors"],
      ["Onboarding and Capability", "/vendors"],
      ["Structured Delivery", "/vendors"],
      ["Agency Partnership", "/vendors"],
    ],
  ],
  [
    "ENTERPRISE",
    [
      ["Deploy Expert Teams", "/register/client"],
      ["Solutions", "/clients"],
      ["How we work with enterprises", "/clients"],
    ],
  ],
  [
    "LEGAL",
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
    <footer id="site-footer" className="lx-footer lx" data-home-region aria-labelledby="footer-title">
      <div className="lx-footer__glow" aria-hidden="true" />
      <div className="lx-container">
        <div className="lx-footer__top">
          <div className="lx-footer__brand">
            <BrandMark footer />
            <h2 id="footer-title" className="lx-footer__title">
              eQOURSE+ — the talent platform by <span className="lx-serif">eQOURSE</span>
            </h2>
            <p>
              Connecting verified specialists, partner agencies and enterprise
              teams for AI training and global content projects.
            </p>
            <div className="lx-footer__ctas">
              {SEGMENTS.map((item) => (
                <Link key={item.id} href={item.href} className="lx-footer__cta">
                  <span>{item.cta}</span>
                  <IconArrowUpRight />
                </Link>
              ))}
              <Link href={LOGIN.href} className="lx-footer__cta lx-footer__cta--quiet">
                <span>{LOGIN.label}</span>
                <IconArrowUpRight />
              </Link>
            </div>
          </div>
          <nav className="lx-footer__cols" aria-label="Footer">
            {FOOTER_COLUMNS.map(([heading, items]) => (
              <div className="lx-footer__col" key={heading}>
                <h3>{heading}</h3>
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

        <div className="lx-footer__bottom">
          <p>
            eQOURSE+ is an enterprise division of EQOURSE ONLINE EDUCATIONERS LLP.
            Operating across Singapore and India.
          </p>
          <p className="lx-footer__status">
            <span className="lx-footer__dot" aria-hidden="true" />
            Transparent project delivery
          </p>
          <a className="lx-footer__parent" href="https://www.eqourse.com/" aria-label="Visit eQOURSE">
            Visit eQOURSE <IconArrowUpRight />
          </a>
        </div>
      </div>
      <div className="lx-footer__word" aria-hidden="true">eQOURSE+</div>
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
