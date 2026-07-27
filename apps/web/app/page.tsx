import type { Metadata } from "next";
import { GlassNav, GlassSubstrate } from "@eqourse/ui";

import {
  HomeAmbientCanvas,
  HomeThemeToggle,
} from "../components/home/home-client-islands";
import { Testimonials } from "../components/home/testimonials";
import { testimonials } from "../content/testimonials";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SOCIAL_IMAGE_ALT,
  structuredData,
} from "./home-data";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: "eQOURSE+",
    locale: "en",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
};

const workflow = [
  {
    title: "Verify",
    body: "Freelancers complete KYC verification before joining the talent network.",
  },
  {
    title: "Test",
    body: "Proctored skill tests help establish tiered talent profiles.",
  },
  {
    title: "Staff",
    body: "Match freelancers and vendor agencies to project staffing needs.",
  },
  {
    title: "Deliver",
    body: "Work moves through delivery and QA, followed by finance workflows for TDS, GST, and global payouts.",
  },
] as const;

const categories = [
  {
    id: "ai-data-services",
    title: "AI Data Services",
    body: "Project staffing for AI data workflows, supported by delivery QA.",
  },
  {
    id: "content-services",
    title: "Content Services",
    body: "Specialists for structured content work, matched to project needs.",
  },
  {
    id: "tutoring",
    title: "Tutoring",
    body: "Tutoring talent from TUTRAIN, verified and tested through the platform.",
  },
] as const;

function ArrowMark() {
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

function TrustMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m12 3 7 3v5c0 4.4-2.8 8.1-7 10-4.2-1.9-7-5.6-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m9 12 2 2 4-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function HomePage() {
  return (
    <main className="home-shell">
      <HomeAmbientCanvas />
      <GlassSubstrate />

      <div className="home-nav-wrap">
        <GlassNav
          id="site-navigation"
          data-home-region
          aria-labelledby="site-navigation-title"
        >
          <span id="site-navigation-title" className="sr-only">
            Primary navigation
          </span>
          <a className="home-wordmark home-nav-link" href="#hero">
            eQOURSE<span aria-hidden="true">+</span>
          </a>
          <div className="home-nav-links">
            <a className="home-nav-link" href="#how-it-works">
              How it works
            </a>
            <a className="home-nav-link" href="#categories">
              Services
            </a>
            <a className="home-nav-link" href="#trust">
              Trust
            </a>
          </div>
          <HomeThemeToggle />
        </GlassNav>
      </div>

      <section
        id="hero"
        className="home-hero"
        data-home-region
        aria-labelledby="hero-title"
      >
        <div className="home-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="home-hero-content">
          <p className="home-eyebrow">The talent platform by eQOURSE</p>
          <h1 id="hero-title">
            Verified talent for work that has to ship.
          </h1>
          <p className="home-hero-copy">
            Staff projects with KYC-verified freelancers and vendor agencies
            across AI data, content, and tutoring.
          </p>
          <div className="home-hero-actions">
            <a
              className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta"
              href="#categories"
            >
              <span className="eq-glass-button__label">Explore services</span>
              <ArrowMark />
            </a>
            <a
              className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta"
              href="#how-it-works"
            >
              <span className="eq-glass-button__label">See how it works</span>
            </a>
          </div>
        </div>
        <p className="home-hero-aside">
          Verification
          <span aria-hidden="true" />
          Testing
          <span aria-hidden="true" />
          Staffing
          <span aria-hidden="true" />
          Delivery
        </p>
      </section>

      <section
        id="trust"
        className="home-trust"
        data-home-region
        aria-labelledby="trust-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Trust, made visible</p>
            <h2 id="trust-title" className="home-section-title">
              Built for accountable delivery
            </h2>
          </div>
          <ul className="home-trust-list">
            <li>
              <TrustMark />
              <span>ISO 9001</span>
            </li>
            <li>
              <TrustMark />
              <span>ISO 27001</span>
            </li>
            <li>
              <span className="home-trust-dot" aria-hidden="true" />
              <span>Operating in India and Singapore</span>
            </li>
            <li>
              <span className="home-trust-dot" aria-hidden="true" />
              <span>Built by EQOURSE ONLINE EDUCATIONERS LLP</span>
            </li>
          </ul>
        </div>
      </section>

      <section
        id="how-it-works"
        className="home-section home-workflow"
        data-home-region
        aria-labelledby="workflow-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading home-section-heading--split">
            <div>
              <p className="home-eyebrow">How it works</p>
              <h2 id="workflow-title" className="home-section-title">
                From verification to delivery
              </h2>
            </div>
            <p>
              A structured path helps teams identify, staff, and manage
              qualified talent.
            </p>
          </div>
          <ol className="home-steps">
            {workflow.map((step) => (
              <li className="home-step" key={step.title}>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="categories"
        className="home-section home-categories"
        data-home-region
        aria-labelledby="categories-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading home-section-heading--split">
            <div>
              <p className="home-eyebrow">Service lines</p>
              <h2 id="categories-title" className="home-section-title">
                Specialist services, one delivery platform
              </h2>
            </div>
            <p>Build teams around the work your project actually requires.</p>
          </div>
          <div className="home-category-list">
            {categories.map((category) => (
              <a
                id={category.id}
                key={category.id}
                className="home-category-link"
                href={`#${category.id}`}
              >
                <span className="home-category-index" aria-hidden="true" />
                <span>
                  <h3>{category.title}</h3>
                  <p>{category.body}</p>
                </span>
                <ArrowMark />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section
        id="stats"
        className="home-stats"
        data-home-region
        aria-labelledby="stats-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Verified foundation</p>
            <h2 id="stats-title" className="home-section-title">
              A foundation you can verify
            </h2>
          </div>
          <dl className="home-stat-list">
            <div>
              <dt>Specialists</dt>
              <dd>500+</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>30+</dd>
            </div>
            <div>
              <dt>Certified standards</dt>
              <dd>ISO 9001 + ISO 27001</dd>
            </div>
            <div>
              <dt>Operating locations</dt>
              <dd>India + Singapore</dd>
            </div>
          </dl>
        </div>
      </section>

      <Testimonials items={testimonials} />

      <footer
        id="site-footer"
        className="home-footer"
        data-home-region
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

      {structuredData.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(block) }}
        />
      ))}
    </main>
  );
}
