import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../../components/public/site-chrome";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import { serializeJsonLd } from "../../lib/json-ld";
import {
  countryHandling,
  freelancerFaq,
  freelancerJourney,
  freelancerStructuredData,
  FREELANCERS_DESCRIPTION,
  FREELANCERS_TITLE,
  verificationDetails,
} from "./freelancers-data";

export const metadata: Metadata = {
  title: FREELANCERS_TITLE,
  description: FREELANCERS_DESCRIPTION,
  alternates: {
    canonical: "/freelancers",
    languages: {
      en: "/freelancers",
      "x-default": "/freelancers",
    },
  },
  openGraph: {
    type: "website",
    url: "/freelancers",
    title: FREELANCERS_TITLE,
    description: FREELANCERS_DESCRIPTION,
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
    title: FREELANCERS_TITLE,
    description: FREELANCERS_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
};

export default function FreelancersPage() {
  return (
    <main id="top" className="home-shell freelancer-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="freelancers" />

      <section className="freelancer-hero" aria-labelledby="freelancer-title">
        <div className="freelancer-hero-field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="freelancer-hero-content">
          <p className="home-eyebrow">For independent specialists</p>
          <h1 id="freelancer-title">
            Bring your skills to work that values proof and quality.
          </h1>
          <p className="freelancer-hero-copy">
            Build a verified profile, demonstrate your skills in proctored
            tests, and deliver project work through a QA-led workbench.
          </p>
          <div className="home-hero-actions">
            <a
              className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta"
              href="#how-it-works"
            >
              <span className="eq-glass-button__label">See how it works</span>
              <ArrowMark />
            </a>
            <a
              className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta"
              href="#faq"
            >
              <span className="eq-glass-button__label">
                Read the freelancer FAQ
              </span>
            </a>
          </div>
          <p className="freelancer-hero-aside">
            Verification
            <span aria-hidden="true" />
            Testing
            <span aria-hidden="true" />
            Matching
            <span aria-hidden="true" />
            Delivery
          </p>
        </div>
      </section>

      <section
        id="how-it-works"
        className="freelancer-section freelancer-journey"
        aria-labelledby="journey-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading home-section-heading--split">
            <div>
              <p className="home-eyebrow">Your path through eQOURSE+</p>
              <h2 id="journey-title" className="home-section-title">
                A clear journey from profile to payout
              </h2>
            </div>
            <p>
              Each stage builds the verified record used for project matching,
              delivery, quality review, and payout.
            </p>
          </div>
          <ol className="freelancer-journey-list">
            {freelancerJourney.map((step) => (
              <li key={step.title} data-testid="journey-step">
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
        className="freelancer-section freelancer-proof"
        aria-labelledby="proof-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Proof before placement</p>
            <h2 id="proof-title" className="home-section-title">
              Verification establishes trust. Quality keeps it current.
            </h2>
            <p className="freelancer-section-intro">
              KYC establishes identity before access to project work.
              Category-specific proctored tests establish demonstrated skill,
              while QA outcomes continue to inform quality scoring.
            </p>
          </div>
          <div className="freelancer-detail-list">
            {verificationDetails.map((detail) => (
              <article key={detail.title}>
                <h3>{detail.title}</h3>
                <p>{detail.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="freelancer-section freelancer-payout"
        aria-labelledby="payout-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Getting paid</p>
            <h2 id="payout-title" className="home-section-title">
              Accepted work, clear records, country-aware handling
            </h2>
            <p className="freelancer-section-intro">
              Accepted task, hourly, or milestone work creates an earnings
              ledger line. At cycle close, approved payouts follow the relevant
              withholding and country rules.
            </p>
          </div>
          <div className="freelancer-country-list">
            {countryHandling.map((country) => (
              <article key={country.title}>
                <p className="home-eyebrow">{country.title}</p>
                <p>{country.body}</p>
              </article>
            ))}
          </div>
          <p className="freelancer-payout-note">
            The platform records payout status and supporting statements
            without tying this page to a named payment provider or settlement
            promise.
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="freelancer-section freelancer-faq"
        aria-labelledby="faq-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Freelancer FAQ</p>
            <h2 id="faq-title" className="home-section-title">
              What to expect
            </h2>
          </div>
          <div className="freelancer-faq-list">
            {freelancerFaq.map((item) => (
              <details key={item.question}>
                <summary>
                  <h3>{item.question}</h3>
                </summary>
                <p data-faq-answer>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      {freelancerStructuredData.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </main>
  );
}
