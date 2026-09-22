import Link from "next/link";

import { PublicThemeToggle } from "../public/public-client-islands";
import styles from "./home-redesign.module.css";
import Image from "next/image";

const footerColumns = [
  [
    "PLATFORM",
    "About eQOURSE+",
    "How It Works",
    "Glass Box Architecture",
    "Quality and Rigor",
    "Trust and Provenance",
    "FAQ",
  ],
  [
    "SPECIALISTS",
    "Join as a Specialist",
    "Specialist Pathways",
    "Verification and Calibration",
    "Domains and Expertise",
    "Earnings and Clarity",
  ],
  [
    "VENDORS",
    "Join as a Vendor",
    "Vendor Network",
    "Onboarding and Capability",
    "Structured Delivery",
    "Agency Partnership",
  ],
  [
    "LEGAL",
    "Privacy Policy",
    "Terms of Service",
    "Cookie Policy",
    "Data Protection",
    "Acceptable Use Policy",
  ],
] as const;

const footerRoutes: Record<string, string> = {
  "About eQOURSE+": "/about",
  "Join as a Specialist": "/freelancers",
  "Join as a Vendor": "/vendors",
  "Vendor Network": "/vendors",
};

function Brand() {
  return (
    <span className={styles.brand}>
      <span>eQOURSE</span>
      <Image
        src="/eQOURSE Plus-04%20(1).svg"
        alt="eQOURSE Logo"
        width={24}
        height={24}
        className={styles.brandMark}
        priority
      />
    </span>
  );
}

type HomeHeaderProps = {
  brandHref?: string;
  activePage?: "about";
};

export function HomeHeader({ brandHref = "#hero", activePage }: HomeHeaderProps = {}) {
  return (
    <header className={styles.headerWrap}>
      <nav
        id="site-navigation"
        className={styles.header}
        data-home-region
        aria-labelledby="site-navigation-title"
      >
        <span id="site-navigation-title" className="sr-only">
          Primary navigation
        </span>
        <a className={styles.brandLink} href={brandHref} aria-label="eQOURSE+">
          <Brand />
        </a>
        <div className={styles.primaryLinks}>
          <a href="#categories">Solutions</a>
          <a href="/freelancers">Experts</a>
          <a href="/vendors">Vendors</a>
          <a href="/about" aria-current={activePage === "about" ? "page" : undefined}>About</a>
        </div>
        <div className={styles.headerActions}>
          <PublicThemeToggle />
          <Link href="/login">Login</Link>
          <Link className={styles.exploreButton} href="/register">
            Access eQOURSE+
          </Link>
        </div>
        <div className="home-nav-links sr-only" aria-hidden="true">
          <a href="#how-it-works">How it works</a>
          <a href="#categories">Services</a>
          <a href="/freelancers">For freelancers</a>
          <a href="/vendors">For vendors</a>
          <a href="/about">About</a>
        </div>
      </nav>
    </header>
  );
}

export function HomeFooter() {
  return (
    <footer
      id="site-footer"
      className={styles.footer}
      data-home-region
      aria-labelledby="footer-title"
    >
      <h2 id="footer-title" className="sr-only">
        eQOURSE+ — the talent platform by eQOURSE
      </h2>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <Brand />
          <p>
            Connecting verified specialists, partner agencies and enterprise
            teams for AI training and global content projects.
          </p>
        </div>
        {footerColumns.map(([heading, ...items]) => (
          <div className={styles.footerColumn} key={heading}>
            <h3>{heading}</h3>
            {items.map((item) => {
              const href = footerRoutes[item];
              return href ? (
                <Link key={item} href={href}>
                  {item}
                </Link>
              ) : (
                <span key={item}>{item}</span>
              );
            })}
          </div>
        ))}
      </div>
      <div className={styles.footerBottom}>
        <p>
          eQOURSE+ is an enterprise division of EQOURSE ONLINE EDUCATIONERS LLP.
          Operating across Singapore and India.
        </p>
        <p>
          <span className={styles.statusDot} />
          Transparent project delivery
        </p>
      </div>
      <a
        className="home-footer-link sr-only"
        href="https://www.eqourse.com/"
        aria-label="Visit eQOURSE"
      >
        Visit eQOURSE
      </a>
    </footer>
  );
}
