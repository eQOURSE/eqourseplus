import { GlassNav } from "@eqourse/ui";

import { PublicThemeToggle } from "./public-client-islands";

export function ArrowMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SiteNavigationProps = {
  page: "home" | "freelancers" | "vendors";
};

export function SiteNavigation({ page }: SiteNavigationProps) {
  const isHome = page === "home";

  return (
    <div className="home-nav-wrap">
      <GlassNav
        id="site-navigation"
        {...(isHome ? { "data-home-region": true } : {})}
        aria-labelledby="site-navigation-title"
      >
        <span id="site-navigation-title" className="sr-only">
          Primary navigation
        </span>
        <a
          className="home-wordmark home-nav-link"
          href={isHome ? "#hero" : "/"}
        >
          eQOURSE<span aria-hidden="true">+</span>
        </a>
        <div className="home-nav-links">
          {isHome ? (
            <>
              <a className="home-nav-link" href="#how-it-works">
                How it works
              </a>
              <a className="home-nav-link" href="#categories">
                Services
              </a>
              <a className="home-nav-link" href="#trust">
                Trust
              </a>
              <a className="home-nav-link" href="/freelancers">
                For freelancers
              </a>
              <a className="home-nav-link" href="/vendors">
                For vendors
              </a>
            </>
          ) : (
            <>
              <a className="home-nav-link" href="/">
                Home
              </a>
              <a
                className="home-nav-link"
                href="/freelancers"
                aria-current={page === "freelancers" ? "page" : undefined}
              >
                For freelancers
              </a>
              <a
                className="home-nav-link"
                href="/vendors"
                aria-current={page === "vendors" ? "page" : undefined}
              >
                For vendors
              </a>
              <a className="home-nav-link" href="#how-it-works">
                How it works
              </a>
              <a className="home-nav-link" href="#faq">
                FAQ
              </a>
            </>
          )}
        </div>
        <PublicThemeToggle />
      </GlassNav>
    </div>
  );
}

type SiteFooterProps = {
  homeRegion?: boolean;
};

export function SiteFooter({ homeRegion = false }: SiteFooterProps) {
  return (
    <footer
      id="site-footer"
      className="home-footer"
      {...(homeRegion ? { "data-home-region": true } : {})}
      aria-labelledby="footer-title"
    >
      <div className="home-section-inner home-footer-inner">
        <div>
          <p className="home-footer-wordmark">eQOURSE+</p>
          <h2 id="footer-title">
            eQOURSE+ — the talent platform by eQOURSE
          </h2>
          <p>EQOURSE ONLINE EDUCATIONERS LLP</p>
        </div>
        <a
          className="home-footer-link"
          href="https://eqourse.com"
          aria-label="Visit eQOURSE"
        >
          Visit eQOURSE
          <ArrowMark />
        </a>
      </div>
    </footer>
  );
}
