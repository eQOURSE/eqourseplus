import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { Testimonials } from "../components/home/testimonials";
import { PublicAmbientCanvas } from "../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../components/public/site-chrome";
import { testimonials } from "../content/testimonials";
import { serializeJsonLd } from "../lib/json-ld";
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

export default function HomePage() {
  return (
    <main className="home-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />

      <SiteNavigation page="home" />

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
          <div className="home-audience-links">
            <a className="home-freelancer-link" href="/freelancers">
              Explore working as a freelancer
              <ArrowMark />
            </a>
            <a className="home-freelancer-link" href="/vendors">
              Explore the vendor agency model
              <ArrowMark />
            </a>
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

      <SiteFooter homeRegion />

      {structuredData.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </main>
  );
}
